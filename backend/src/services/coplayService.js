const { randomInt } = require('node:crypto')
const { pool } = require('../db.js')
const { httpError } = require('../httpError.js')
const questionService = require('./questionService.js')

// No 0/O/1/I, so a code is easy to read out loud and type in
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

function generateCode() {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('')
}

// The questions are built once and stored on the room, so every player who joins
// is served the exact same questions and answer options.
async function createRoom(user, difficulty) {
  const { pickedCountries, questions } = await questionService.buildQuiz(difficulty)
  const countryIds = pickedCountries.map((country) => country.id)
  // Ledtråden får aldrig följa med frågorna: då kan den läsas utan att räknas
  const shared = questions.map(({ hint, ...question }) => question)

  // Retry on the rare chance that two rooms draw the same code
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    try {
      const [result] = await pool.execute(
        'INSERT INTO coplay_rooms (code, host_id, difficulty, questions) VALUES (?, ?, ?, ?)',
        [code, user.id, difficulty, JSON.stringify({ countryIds, questions: shared })],
      )
      await pool.execute(
        'INSERT INTO coplay_players (room_id, user_id) VALUES (?, ?)',
        [result.insertId, user.id],
      )
      return { code, difficulty, isHost: true }
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY') throw err
    }
  }
  throw httpError(500, 'Could not create a room code')
}

async function findRoom(code) {
  const [rooms] = await pool.execute(
    'SELECT id, code, host_id AS hostId, difficulty, questions, started_at AS startedAt FROM coplay_rooms WHERE code = ?',
    [typeof code === 'string' ? code.trim().toUpperCase() : ''],
  )
  return rooms[0] || null
}

async function joinRoom(user, code) {
  const room = await findRoom(code)
  if (!room) throw httpError(404, 'Hittade inget spel med den koden')
  if (room.startedAt) throw httpError(409, 'Spelet har redan startat')

  await pool.execute(
    'INSERT IGNORE INTO coplay_players (room_id, user_id) VALUES (?, ?)',
    [room.id, user.id],
  )
  return { code: room.code, difficulty: room.difficulty, isHost: room.hostId === user.id }
}

// Everyone in the lobby polls this to see who has joined and whether the host has started
async function getLobby(user, code) {
  const room = await findRoom(code)
  if (!room) throw httpError(404, 'Hittade inget spel med den koden')

  const [players] = await pool.execute(
    `SELECT users.id, users.display_name AS displayName, users.email, users.avatar
     FROM coplay_players JOIN users ON users.id = coplay_players.user_id
     WHERE coplay_players.room_id = ? ORDER BY coplay_players.joined_at`,
    [room.id],
  )

  return {
    code: room.code,
    difficulty: room.difficulty,
    isHost: room.hostId === user.id,
    started: Boolean(room.startedAt),
    players: players.map((player) => ({
      id: player.id,
      name: player.displayName || player.email.split('@')[0],
      avatar: player.avatar,
    })),
  }
}

// Only the host starts the game. This closes the room for new players.
async function startRoom(user, code) {
  const room = await findRoom(code)
  if (!room) throw httpError(404, 'Hittade inget spel med den koden')
  if (room.hostId !== user.id) throw httpError(403, 'Bara värden kan starta spelet')
  if (room.startedAt) throw httpError(409, 'Spelet har redan startat')

  await pool.execute('UPDATE coplay_rooms SET started_at = UTC_TIMESTAMP() WHERE id = ?', [room.id])
  return { started: true }
}

// Gives the player the stored questions and their own attempt, so the finished quiz
// is saved and graded exactly like a solo quiz.
async function getQuestions(user, code) {
  const room = await findRoom(code)
  if (!room) throw httpError(404, 'Hittade inget spel med den koden')
  if (!room.startedAt) throw httpError(409, 'Spelet har inte startat än')

  const [players] = await pool.execute(
    'SELECT attempt_id AS attemptId FROM coplay_players WHERE room_id = ? AND user_id = ?',
    [room.id, user.id],
  )
  if (!players[0]) throw httpError(403, 'Du är inte med i det här spelet')

  const { countryIds, questions } = typeof room.questions === 'string' ? JSON.parse(room.questions) : room.questions

  // One attempt per player, created the first time they ask for the questions
  let attemptId = players[0].attemptId
  if (!attemptId) {
    attemptId = await questionService.saveAttempt(
      user.id,
      room.difficulty,
      countryIds.map((id) => ({ id })),
    )
    await pool.execute(
      'UPDATE coplay_players SET attempt_id = ? WHERE room_id = ? AND user_id = ?',
      [attemptId, room.id, user.id],
    )
  }

  return { attemptId, difficulty: room.difficulty, questions }
}

// Scoreboard: everyone's score, ranked. Same order as a highscore: most correct, then fastest.
async function getScores(user, code) {
  const room = await findRoom(code)
  if (!room) throw httpError(404, 'Hittade inget spel med den koden')

  const [rows] = await pool.execute(
    `SELECT users.id, users.display_name AS displayName, users.email, users.avatar,
            quiz_attempts.score, quiz_attempts.total_questions AS total, quiz_attempts.xp,
            quiz_attempts.completed_at AS completedAt,
            TIMESTAMPDIFF(SECOND, quiz_attempts.started_at, quiz_attempts.completed_at) AS durationSeconds
     FROM coplay_players
     JOIN users ON users.id = coplay_players.user_id
     LEFT JOIN quiz_attempts ON quiz_attempts.id = coplay_players.attempt_id
     WHERE coplay_players.room_id = ?`,
    [room.id],
  )

  // Unfinished players sort last, then most correct, then fastest
  const players = rows
    .map((row) => ({
      id: row.id,
      name: row.displayName || row.email.split('@')[0],
      avatar: row.avatar,
      finished: Boolean(row.completedAt),
      score: row.completedAt ? row.score : null,
      total: row.total ?? 10,
      xp: row.completedAt ? row.xp : null,
      durationSeconds: row.durationSeconds,
    }))
    .sort((a, b) => {
      if (a.finished !== b.finished) return a.finished ? -1 : 1
      if (!a.finished) return 0
      if (a.score !== b.score) return b.score - a.score
      return a.durationSeconds - b.durationSeconds
    })
    .map((player, index) => ({ ...player, place: player.finished ? index + 1 : null }))

  return { code: room.code, difficulty: room.difficulty, players }
}

module.exports = {
  createRoom,
  joinRoom,
  getLobby,
  startRoom,
  getQuestions,
  getScores,
}
