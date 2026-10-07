const resultService = require('../services/resultService.js')
const { QUESTIONS_PER_QUIZ, SUPPORTED_DIFFICULTIES } = require('../services/questionService.js')

// Exactly one answer per question (number 1–10).
// country is the chosen answer, or null when the question was skipped.
function isValidAnswers(answers) {
  if (!Array.isArray(answers) || answers.length !== QUESTIONS_PER_QUIZ) return false

  const everyAnswerValid = answers.every((answer) =>
    answer !== null &&
    typeof answer === 'object' &&
    Number.isInteger(answer.number) &&
    answer.number >= 1 &&
    answer.number <= QUESTIONS_PER_QUIZ &&
    typeof answer.flagCode === 'string' &&
    (answer.country === null || (typeof answer.country === 'string' && answer.country.length <= 100)),
  )
  const uniqueNumbers = new Set(answers.map((answer) => answer?.number)).size === QUESTIONS_PER_QUIZ

  return everyAnswerValid && uniqueNumbers
}

// POST /api/results – sends in all answers when the quiz is finished
// Body: { "attemptId": 42 | null, "difficulty": "beginner", "answers": [{ "number": 1, "flagCode": "se", "country": "Sverige" }, ...] }
async function submit(req, res) {
  const { attemptId = null, difficulty, answers } = req.body || {}

  if (!SUPPORTED_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({ error: 'Unknown difficulty' })
  }
  if (attemptId !== null && !(Number.isInteger(attemptId) && attemptId > 0)) {
    return res.status(400).json({ error: 'Invalid attemptId' })
  }
  if (!isValidAnswers(answers)) {
    return res.status(400).json({ error: `Answers must contain exactly ${QUESTIONS_PER_QUIZ} valid answers` })
  }

  // req.user is set by loadUser: the logged-in user, or null for guests
  const result = await resultService.submitResults({ attemptId, difficulty, answers }, req.user)
  res.json(result)
}

// GET /api/results/stats?difficulty=beginner – latest result and highscore (logged in only)
async function stats(req, res) {
  const { difficulty } = req.query

  if (!SUPPORTED_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({ error: 'Unknown difficulty' })
  }

  res.json(await resultService.getStats(req.user.id, difficulty))
}

module.exports = {
  submit,
  stats,
}
