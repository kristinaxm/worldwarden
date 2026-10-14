const resultService = require('../services/resultService.js')
const xpService = require('../services/xpService.js')
const { LEVELS, QUESTIONS_PER_QUIZ, SUPPORTED_DIFFICULTIES } = require('../quizLevels.js')

// Exactly one answer per question (number 1–10).
// answerField is "country" for beginner and "capital" for medium (see quizLevels.js).
// Its value is the chosen answer, or null when the question was skipped.
function isValidAnswers(answers, answerField) {
  if (!Array.isArray(answers) || answers.length !== QUESTIONS_PER_QUIZ) return false

  const everyAnswerValid = answers.every((answer) =>
    answer !== null &&
    typeof answer === 'object' &&
    Number.isInteger(answer.number) &&
    answer.number >= 1 &&
    answer.number <= QUESTIONS_PER_QUIZ &&
    typeof answer.flagCode === 'string' &&
    (answer[answerField] === null ||
      (typeof answer[answerField] === 'string' && answer[answerField].length <= 100)),
  )
  const uniqueNumbers = new Set(answers.map((answer) => answer?.number)).size === QUESTIONS_PER_QUIZ

  return everyAnswerValid && uniqueNumbers
}

// POST /api/results – sends in all answers when the quiz is finished
// Body: { "attemptId": 42 | null, "difficulty": "beginner", "answers": [{ "number": 1, "flagCode": "se", "country": "Sverige" }, ...] }
// Medium sends "capital" instead of "country": { "number": 1, "flagCode": "se", "capital": "Stockholm" }
async function submit(req, res) {
  const { attemptId = null, difficulty, answers } = req.body || {}

  if (!SUPPORTED_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({ error: 'Unknown difficulty' })
  }
  if (attemptId !== null && !(Number.isInteger(attemptId) && attemptId > 0)) {
    return res.status(400).json({ error: 'Invalid attemptId' })
  }
  if (!isValidAnswers(answers, LEVELS[difficulty].answerField)) {
    return res.status(400).json({ error: `Answers must contain exactly ${QUESTIONS_PER_QUIZ} valid answers` })
  }

  // req.user is set by loadUser: the logged-in user, or null for guests.
  // 403 if the difficulty is locked (also for quizzes started before logging in).
  await xpService.assertCanPlay(req.user, difficulty)

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

async function history(req, res) {
  const { difficulty } = req.query
  if (!SUPPORTED_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({ error: 'Unknown difficulty' })
  }
  res.json(await resultService.getHistory(req.user.id, difficulty))
}

module.exports = {
  submit,
  stats,
  history,
}
