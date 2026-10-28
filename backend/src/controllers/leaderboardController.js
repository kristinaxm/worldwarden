const leaderboardService = require('../services/leaderboardService.js')
const { SUPPORTED_DIFFICULTIES } = require('../quizLevels.js')

const BOARDS = ['xp', ...SUPPORTED_DIFFICULTIES]

// GET /api/leaderboard/:board?page=1 – board is "xp" or a difficulty (beginner, medium, ...)
async function getBoard(req, res) {
  const { board } = req.params
  const page = Number(req.query.page ?? 1)

  if (!BOARDS.includes(board)) {
    return res.status(404).json({ error: 'Unknown leaderboard' })
  }
  if (!(Number.isInteger(page) && page >= 1 && page <= 10_000)) {
    return res.status(400).json({ error: 'Invalid page' })
  }

  // req.user is set by loadUser: the logged-in user, or null for guests
  res.json(await leaderboardService.getPage(board, page, req.user?.id ?? null))
}

// GET /api/leaderboard/players/:id/medals, the medal ids of a player on the leaderboards
async function getPlayerMedals(req, res) {
  const id = Number(req.params.id)

  if (!(Number.isInteger(id) && id > 0)) {
    return res.status(400).json({ error: 'Invalid player id' })
  }

  res.json(await leaderboardService.getPlayerMedals(id))
}

module.exports = {
  getBoard,
  getPlayerMedals,
}
