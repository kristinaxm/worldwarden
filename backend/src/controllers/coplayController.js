const coplayService = require('../services/coplayService.js')
const xpService = require('../services/xpService.js')
const { SUPPORTED_DIFFICULTIES } = require('../quizLevels.js')

// A code is always 6 characters from the room alphabet
const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/

function validCode(req, res) {
  const code = typeof req.params.code === 'string' ? req.params.code.trim().toUpperCase() : ''
  if (!CODE_PATTERN.test(code)) {
    res.status(400).json({ error: 'Ogiltig spelkod' })
    return null
  }
  return code
}

// POST /api/coplay – host creates a room and gets the code to share
async function create(req, res) {
  const { difficulty } = req.body || {}
  if (!SUPPORTED_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({ error: 'Unknown difficulty' })
  }
  await xpService.assertCanPlay(req.user, difficulty)

  res.status(201).json(await coplayService.createRoom(req.user, difficulty))
}

// POST /api/coplay/:code/join – another player joins with the code
async function join(req, res) {
  const code = validCode(req, res)
  if (!code) return

  const room = await coplayService.joinRoom(req.user, code)
  // The difficulty has to be unlocked for the joining player too
  await xpService.assertCanPlay(req.user, room.difficulty)
  res.json(room)
}

// GET /api/coplay/:code – lobby: who has joined and has the host started
async function lobby(req, res) {
  const code = validCode(req, res)
  if (!code) return
  res.json(await coplayService.getLobby(req.user, code))
}

// POST /api/coplay/:code/start – only the host
async function start(req, res) {
  const code = validCode(req, res)
  if (!code) return
  res.json(await coplayService.startRoom(req.user, code))
}

// GET /api/coplay/:code/questions – the shared questions plus this player's own attempt
async function questions(req, res) {
  const code = validCode(req, res)
  if (!code) return
  res.json(await coplayService.getQuestions(req.user, code))
}

// GET /api/coplay/:code/scores – everyone's score and placement
async function scores(req, res) {
  const code = validCode(req, res)
  if (!code) return
  res.json(await coplayService.getScores(req.user, code))
}

module.exports = { create, join, lobby, start, questions, scores }
