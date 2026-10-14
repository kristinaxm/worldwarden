const questionService = require('../services/questionService.js')
const xpService = require('../services/xpService.js')
const { QUESTIONS_PER_QUIZ, SUPPORTED_DIFFICULTIES } = require('../quizLevels.js')

// POST /api/questions – starts a new quiz
// Body: { "difficulty": "beginner" | "medium" }
async function start(req, res) {
  const { difficulty } = req.body || {}

  if (!SUPPORTED_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({ error: 'Unknown difficulty' })
  }

  // req.user is set by loadUser: the logged-in user, or null for guests.
  // 403 if the user's level (or being a guest) doesn't allow this difficulty.
  await xpService.assertCanPlay(req.user, difficulty)

  const quiz = await questionService.createQuiz(difficulty, req.user)
  res.status(201).json(quiz)
}

// POST /api/questions/hint – shows the hint for one question (logged in only)
// Body: { "attemptId": 42, "number": 3 }
async function hint(req, res) {
  const { attemptId, number } = req.body || {}

  if (!(Number.isInteger(attemptId) && attemptId > 0)) {
    return res.status(400).json({ error: 'Invalid attemptId' })
  }
  if (!(Number.isInteger(number) && number >= 1 && number <= QUESTIONS_PER_QUIZ)) {
    return res.status(400).json({ error: 'Invalid question number' })
  }

  res.json(await questionService.useHint(req.user.id, attemptId, number))
}

module.exports = {
  start,
  hint,
}
