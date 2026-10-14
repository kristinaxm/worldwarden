const { pool } = require('../db.js')
const countryService = require('./countryService.js')
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
function pickWrongCountries(country, allCountries, count) {
  const otherCountries = allCountries.filter((other) => other.id !== country.id)
  const sameContinent = shuffle(otherCountries.filter((other) => other.continent === country.continent))
  const otherContinents = shuffle(otherCountries.filter((other) => other.continent !== country.continent))

  return [...sameContinent, ...otherContinents].slice(0, count)
}

// Builds one question: a flag and the options for the level, one of them correct.
// The level decides how many options there are and what they are:
// beginner = 2 country names, medium = 4 capitals.
// The correct answer is never sent to the client and the options are shuffled.
function buildQuestion(level, country, allCountries, number) {

  if (level.optionCount === 0) {
    return {
      number,
      flagCode: country.code.toLowerCase(),
      answerField: level.answerField,
      hint: level.hint ? level.hint(country) : null,
    }
  }
  const wrongCountries = pickWrongCountries(country, allCountries, level.optionCount - 1)
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
    buildQuestion(LEVELS[difficulty], country, allCountries, index + 1),
  )

  const attemptId = user ? await saveAttempt(user.id, difficulty, pickedCountries) : null

  return {
    attemptId,
    difficulty,
    questions,
  }
}
//#endregion


module.exports = {
  createQuiz,
}
