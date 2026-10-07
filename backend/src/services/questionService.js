const { pool } = require('../db.js')
const countryService = require('./countryService.js')


//#region Config
const QUESTIONS_PER_QUIZ = 10

// Difficulties that can be played right now. Controllers use this to validate input.
const SUPPORTED_DIFFICULTIES = ['beginner']
//#endregion


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

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)]
}
//#endregion


//#region Beginner
// Picks a wrong answer for a question. Prefers a country on the same continent
// Example: If question is Sweden it prefers a country in Europe (Norway, Denmark, Spain etc.)
function pickWrongCountry(country, allCountries) {
  const otherCountries = allCountries.filter((other) => other.id !== country.id)
  const sameContinent = otherCountries.filter((other) => other.continent === country.continent)

  return pickRandom(sameContinent.length > 0 ? sameContinent : otherCountries)
}

// Beginner: a flag and two country names, one of them correct.
// The correct answer is never sent to the client and the options are shuffled.
function buildBeginnerQuestion(country, allCountries, number) {
  const wrongCountry = pickWrongCountry(country, allCountries)

  return {
    number,
    flagCode: country.code.toLowerCase(),
    options: shuffle([country.name, wrongCountry.name]),
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
    buildBeginnerQuestion(country, allCountries, index + 1),
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
  QUESTIONS_PER_QUIZ,
  SUPPORTED_DIFFICULTIES,
  createQuiz,
}
