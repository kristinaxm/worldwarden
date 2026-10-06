const { pool } = require('../db.js')


//#region Config
const QUESTIONS_PER_QUIZ = 10

// Difficulties that can be played right now. The controller uses this to validate input.
const SUPPORTED_DIFFICULTIES = ['beginner']
//#endregion


//#region Countries
// TEMPORARY: replace with countryService.getAllCountries() once it is merged.
// It must return the same fields: id, code, name, continent.
async function getAllCountries() {
  const [countries] = await pool.query(
    'SELECT id, code, name, continent FROM countries',
  )
  return countries
}
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


//#region Create quiz
// Creates a new quiz with 10 random, unique countries.
// Nothing is saved yet – attemptId is always null until attempts are stored (next PR).
async function createQuiz(difficulty) {
  const allCountries = await getAllCountries()

  if (allCountries.length < QUESTIONS_PER_QUIZ) {
    throw new Error('Not enough countries in the database to create a quiz')
  }

  const pickedCountries = shuffle(allCountries).slice(0, QUESTIONS_PER_QUIZ)

  const questions = pickedCountries.map((country, index) =>
    buildBeginnerQuestion(country, allCountries, index + 1),
  )

  return {
    attemptId: null,
    difficulty,
    questions,
  }
}
//#endregion


module.exports = {
  SUPPORTED_DIFFICULTIES,
  createQuiz,
}
