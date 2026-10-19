const { pool } = require('../db.js')
const countryService = require('./countryService.js')
const { httpError } = require('../httpError.js')
const { LEVELS, QUESTIONS_PER_QUIZ } = require('../quizLevels.js')


//#region Random helpers
// Returns a shuffled copy of the array (Fisher–Yates). The original array is not changed.
function shuffle(items) {
  const shuffled = [...items]

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[randomIndex]
    shuffled[randomIndex] = temp
  }

  return shuffled
}
//#endregion


//#region Questions
// Picks `count` wrong answers for a question. Prefers countries on the same continent
// Example: If question is Sweden it prefers countries in Europe (Norway, Denmark, Spain etc.)
// If the continent has too few countries, the rest are taken from other continents.
function pickWrongCountries(country, allCountries, count, difficulty) {
  const otherCountries = allCountries.filter((other) => other.id !== country.id)

  if (difficulty === 'beginner') {
    const uniqueContinents = new Map()
    for (const c of shuffle(otherCountries)) {
      if (c.continent === country.continent) continue
      if (!uniqueContinents.has(c.continent)) {
        uniqueContinents.set(c.continent, c)
      }
    }
    return [...uniqueContinents.values()].slice(0, count)
  }

  if (difficulty === 'medium') {
    const uniqueCountries = new Map()
    for (const c of shuffle(otherCountries)) {
      if (c.continent === country.continent) continue
      if (!uniqueCountries.has(c.continent)) {
        uniqueCountries.set(c.continent, c)
      }
    }
    return shuffle([...uniqueCountries.values()]).slice(0, count)
  }

  const sameContinent = shuffle(otherCountries.filter((other) => other.continent === country.continent))
  const otherContinents = shuffle(otherCountries.filter((other) => other.continent !== country.continent))

  return [...sameContinent, ...otherContinents].slice(0, count)
}

// Builds one question: a flag and the options for the level, one of them correct.
// The level decides how many options there are and what they are:
// beginner = 2 continents, medium = 4 countries.
// The correct answer is never sent to the client and the options are shuffled.
function buildQuestion(level, country, allCountries, number, difficulty) {

  if (level.optionCount === 0) {
    return {
      number,
      flagCode: country.code.toLowerCase(),
      answerField: level.answerField,
      hint: level.hint ? level.hint(country) : null,
    }
  }
  const wrongCountries = pickWrongCountries(country, allCountries, level.optionCount - 1, difficulty)
  const options = [country, ...wrongCountries].map(level.correctAnswer)

  return {
    number,
    flagCode: country.code.toLowerCase(),
    options: shuffle(options),
  }
}
//#endregion


//#region Save attempt
// Logged-in users only: saves the quiz before it is played, so the server knows
// which countries were asked and when the quiz started (started_at = now).
// resultService fills in the answers, score and completed_at when the quiz is finished.
async function saveAttempt(userId, difficulty, countries) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [attempt] = await connection.execute(
      'INSERT INTO quiz_attempts (user_id, difficulty, total_questions) VALUES (?, ?, ?)',
      [userId, difficulty, countries.length],
    )

    // One row per question: [attempt_id, country_id, question_number]
    const answerRows = countries.map((country, index) => [attempt.insertId, country.id, index + 1])
    await connection.query(
      'INSERT INTO quiz_answers (attempt_id, country_id, question_number) VALUES ?',
      [answerRows],
    )

    await connection.commit()
    return attempt.insertId
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}
//#endregion


//#region Create quiz
// Creates a new quiz with 10 random, unique countries.
// user is null for guests – then nothing is saved and attemptId is null.
async function createQuiz(difficulty, user) {
  const allCountries = await countryService.getAll()

  if (allCountries.length < QUESTIONS_PER_QUIZ) {
    throw new Error('Not enough countries in the database to create a quiz')
  }

  const pickedCountries = shuffle(allCountries).slice(0, QUESTIONS_PER_QUIZ)

  const questions = pickedCountries.map((country, index) =>
    buildQuestion(LEVELS[difficulty], country, allCountries, index + 1, difficulty),
  )

  const attemptId = user ? await saveAttempt(user.id, difficulty, pickedCountries) : null

  return {
    attemptId,
    difficulty,
    questions,
  }
}
//#endregion


//#region Hint
// Logged-in users only: returns the hint for one question and marks it as used, so a correct
// answer to it gives half XP. The flag is set here on the server – the client never sends it.
async function useHint(userId, attemptId, number) {
  const [[question]] = await pool.execute(
    `SELECT quiz_attempts.user_id AS userId, quiz_attempts.difficulty, quiz_attempts.completed_at AS completedAt,
            quiz_answers.used_hint AS usedHint, countries.code, countries.name, countries.capital, countries.continent
     FROM quiz_attempts
     JOIN quiz_answers ON quiz_answers.attempt_id = quiz_attempts.id
     JOIN countries ON countries.id = quiz_answers.country_id
     WHERE quiz_attempts.id = ? AND quiz_answers.question_number = ?`,
    [attemptId, number],
  )
  if (!question || question.userId !== userId) throw httpError(404, 'Quiz not found')
  if (question.completedAt) throw httpError(409, 'Quiz is already finished')

  if (question.usedHint) {
  // Hint redan använd – returnera samma
  const level = LEVELS[question.difficulty]
  return { number, hint: level.hint(question) }
}

  // A level gets hints by adding hint: (country) => ... in quizLevels.js
  const level = LEVELS[question.difficulty]
  if (!level?.hint) throw httpError(400, 'This difficulty has no hints')

  await pool.execute(
    'UPDATE quiz_answers SET used_hint = TRUE WHERE attempt_id = ? AND question_number = ?',
    [attemptId, number],
  )

  return { number, hint: level.hint(question) }
}
//#endregion


module.exports = {
  createQuiz,
  useHint,
}
