const { pool } = require('../db.js')
const { httpError } = require('../httpError.js')
const { levelForXp } = require('../xpLevels.js')
const medalService = require('./medalService.js')

const PAGE_SIZE = 20

// Time in seconds from start to finish, calculated by the database
const DURATION_SQL = 'TIMESTAMPDIFF(SECOND, started_at, completed_at)'


//#region Boards
// One row per player.
// order decides the place, tiebreak only the order between players who share a place.
const XP_BOARD = {
  players: `
    SELECT users.id, users.display_name, users.avatar,
           SUM(quiz_attempts.xp) AS totalXp, COUNT(*) AS quizCount
    FROM quiz_attempts JOIN users ON users.id = quiz_attempts.user_id
    WHERE quiz_attempts.completed_at IS NOT NULL
    GROUP BY users.id`,
  order: 'totalXp DESC',
  tiebreak: 'id ASC',
  stats: (row) => {
    const totalXp = Number(row.totalXp)
    const { level, name } = levelForXp(totalXp)
    return { totalXp, level: { level, name }, quizCount: Number(row.quizCount) }
  },
}

// Only each players best quiz on the difficulty: most correct, then fastest.
// Same score and time: the one who got it first is shown above.
const QUIZ_BOARD = {
  players: `
    SELECT users.id, users.display_name, users.avatar,
           best.score, best.total, best.durationSeconds, best.completedAt
    FROM (
      SELECT user_id, score, total_questions AS total, ${DURATION_SQL} AS durationSeconds,
             completed_at AS completedAt,
             ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY score DESC, ${DURATION_SQL} ASC, completed_at ASC, id ASC) AS attemptOrder
      FROM quiz_attempts
      WHERE difficulty = ? AND completed_at IS NOT NULL
    ) AS best
    JOIN users ON users.id = best.user_id
    WHERE best.attemptOrder = 1`,
  order: 'score DESC, durationSeconds ASC',
  tiebreak: 'completedAt ASC, id ASC',
  stats: (row) => ({
    score: row.score,
    total: row.total,
    durationSeconds: row.durationSeconds,
    completedAt: row.completedAt,
  }),
}
//#endregion


//#region Ranking
// place: players with the same result share it (1, 2, 2, 4).
// position: unique order, used for the pages.
function rankedSql(board) {
  return `
    WITH players AS (${board.players}),
    ranked AS (
      SELECT players.*,
             RANK() OVER (ORDER BY ${board.order}) AS place,
             ROW_NUMBER() OVER (ORDER BY ${board.order}, ${board.tiebreak}) AS position
      FROM players
    )`
}

// Never sends the email, everyone can see the leaderboard, also guests.
// id is used to fetch the players medals (GET /api/leaderboard/players/:id/medals).
function toEntry(board, row, userId) {
  return {
    id: row.id,
    place: Number(row.place),
    name: row.display_name || `Spelare #${row.id}`,
    avatar: row.avatar,
    isMe: row.id === userId,
    ...board.stats(row),
  }
}
//#endregion


//#region Get page
// GET /api/leaderboard/:board?page=1
// boardName is 'xp' or a difficulty. userId is null for guests, then me is null.
async function getPage(boardName, page, userId) {
  const board = boardName === 'xp' ? XP_BOARD : QUIZ_BOARD
  const params = boardName === 'xp' ? [] : [boardName]
  const sql = rankedSql(board)

  // query instead of execute: execute can't take LIMIT/OFFSET as placeholders
  const [[rows], [[{ totalPlayers }]], [[me]]] = await Promise.all([
    pool.query(`${sql} SELECT * FROM ranked ORDER BY position LIMIT ? OFFSET ?`, [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE]),
    pool.query(`${sql} SELECT COUNT(*) AS totalPlayers FROM ranked`, params),
    userId ? pool.query(`${sql} SELECT * FROM ranked WHERE id = ?`, [...params, userId]) : [[]],
  ])

  return {
    board: boardName,
    page,
    pageSize: PAGE_SIZE,
    totalPlayers: Number(totalPlayers),
    totalPages: Math.max(1, Math.ceil(totalPlayers / PAGE_SIZE)),
    entries: rows.map((row) => toEntry(board, row, userId)),
    // The logged-in player's own row and the page it is on. null if they haven't played this board.
    me: me ? { ...toEntry(board, me, userId), page: Math.ceil(Number(me.position) / PAGE_SIZE) } : null,
  }
}
//#endregion


//#region Player medals
// GET /api/leaderboard/players/:id/medals, the medals of a player on the leaderboards.
// Only players with a finished quiz are on the leaderboards, so others give 404
// (otherwise anyone could check which user ids exist).
async function getPlayerMedals(playerId) {
  const [[finished]] = await pool.execute(
    'SELECT 1 FROM quiz_attempts WHERE user_id = ? AND completed_at IS NOT NULL LIMIT 1',
    [playerId],
  )
  if (!finished) throw httpError(404, 'Player not found')

  return medalService.getUnlocked(playerId)
}
//#endregion


module.exports = {
  PAGE_SIZE,
  getPage,
  getPlayerMedals,
}
