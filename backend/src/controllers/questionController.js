const questionService = require('../services/questionService.js')

// POST /api/questions – starts a new quiz
// Body: { "difficulty": "beginner" }
async function start(req, res) {
  const { difficulty } = req.body || {}

  if (!questionService.SUPPORTED_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({ error: 'Unknown difficulty' })
  }

  const quiz = await questionService.createQuiz(difficulty)
  res.status(201).json(quiz)
}

module.exports = {
  start,
}
