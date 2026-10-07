const questionService = require('../services/questionService.js')

// POST /api/questions – starts a new quiz
// Body: { "difficulty": "beginner" }
async function start(req, res) {
  const { difficulty } = req.body || {}

  if (!questionService.SUPPORTED_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({ error: 'Unknown difficulty' })
  }

  // req.user is set by loadUser: the logged-in user, or null for guests
  const quiz = await questionService.createQuiz(difficulty, req.user)
  res.status(201).json(quiz)
}

module.exports = {
  start,
}
