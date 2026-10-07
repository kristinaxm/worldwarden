const { pool } = require('../db.js')
const countryService = require('./countryService.js')
const { httpError } = require('../httpError.js')


//#region Grading
// How an answer is graded per difficulty. Add medium, advanced and expert here later.
const graders = {
  beginner: (country, answer) => answer.country === country.name,
}

// questions: the correct country for each question – [{ number, code, name }]
// answers: what the user answered – [{ number, country }]
function gradeAnswers(difficulty, questions, answers) {
  const isCorrect = graders[difficulty]

  return questions.map((question) => {
    const answer = answers.find((item) => item.number === question.number)

    return {
      number: question.number,
      flagCode: question.code.toLowerCase(),
      answer: answer.country,
      correct: isCorrect(question, answer),
      correctAnswer: question.name,
    }
  })
}

function countCorrect(gradedAnswers) {
  return gradedAnswers.filter((answer) => answer.correct).length
}
//#endregion


//#region Highscore and stats
// Time in seconds from start to finish, calculated by the database
const DURATION_SQL = 'TIMESTAMPDIFF(SECOND, started_at, completed_at)'

// Better = more correct answers. Same number correct = faster time.
function isBetter(result, best) {
  if (!best) return true
  if (result.score !== best.score) return result.score > best.score
  return result.durationSeconds < best.durationSeconds
}

// db is either the pool or a connection inside a transaction
async function findBest(db, userId, difficulty) {
  const [rows] = await db.execute(
    `SELECT score, total_questions AS total, ${DURATION_SQL} AS durationSeconds
     FROM quiz_attempts
     WHERE user_id = ? AND difficulty = ? AND completed_at IS NOT NULL
     ORDER BY score DESC, durationSeconds ASC
     LIMIT 1`,
    [userId, difficulty],
  )
  return rows[0] || null
}

async function findLast(db, userId, difficulty) {
  const [rows] = await db.execute(
    `SELECT score, total_questions AS total, ${DURATION_SQL} AS durationSeconds
     FROM quiz_attempts
     WHERE user_id = ? AND difficulty = ? AND completed_at IS NOT NULL
     ORDER BY completed_at DESC, id DESC
     LIMIT 1`,
    [userId, difficulty],
  )
  return rows[0] || null
}

// Latest result and highscore for the quiz intro. Unfinished quizzes are ignored.
async function getStats(userId, difficulty) {
  return {
    last: await findLast(pool, userId, difficulty),
    best: await findBest(pool, userId, difficulty),
  }
}
//#endregion


//#region Guest
// Guests have no saved quiz, so the correct country is looked up from the flag code
async function gradeGuestAnswers(difficulty, answers) {
  const countries = await countryService.getAll()
  const countriesByCode = new Map(countries.map((country) => [country.code.toLowerCase(), country]))

  const questions = answers
    .map((answer) => {
      const country = countriesByCode.get(answer.flagCode.toLowerCase())
      if (!country) throw httpError(400, 'Unknown flag code')
      return { number: answer.number, code: country.code, name: country.name }
    })
    .sort((a, b) => a.number - b.number)

  const gradedAnswers = gradeAnswers(difficulty, questions, answers)

  return {
    saved: false,
    score: countCorrect(gradedAnswers),
    total: gradedAnswers.length,
    durationSeconds: null,
    newHighscore: false,
    previousBest: null,
    answers: gradedAnswers,
  }
}
//#endregion


//#region Logged-in user
// Grades against the countries saved when the quiz started (never the flag codes from
// the client, so nobody can send in easier questions) and saves the result.
async function saveResult(userId, attemptId, difficulty, answers) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    // FOR UPDATE locks the row, so the same quiz can't be submitted twice at the same time
    const [[attempt]] = await connection.execute(
      'SELECT user_id, difficulty, completed_at FROM quiz_attempts WHERE id = ? FOR UPDATE',
      [attemptId],
    )
    if (!attempt || attempt.user_id !== userId) throw httpError(404, 'Quiz not found')
    if (attempt.completed_at) throw httpError(409, 'Quiz is already finished')
    if (attempt.difficulty !== difficulty) throw httpError(400, 'Difficulty does not match the quiz')

    const [questions] = await connection.execute(
      `SELECT quiz_answers.question_number AS number, countries.code, countries.name
       FROM quiz_answers JOIN countries ON countries.id = quiz_answers.country_id
       WHERE quiz_answers.attempt_id = ?
       ORDER BY quiz_answers.question_number`,
      [attemptId],
    )

    const gradedAnswers = gradeAnswers(difficulty, questions, answers)
    const score = countCorrect(gradedAnswers)

    // Must be read before this quiz is marked as finished, otherwise it compares with itself
    const previousBest = await findBest(connection, userId, difficulty)

    for (const answer of gradedAnswers) {
      await connection.execute(
        'UPDATE quiz_answers SET country_answer = ?, is_correct = ? WHERE attempt_id = ? AND question_number = ?',
        [answer.answer, answer.correct ? 1 : 0, attemptId, answer.number],
      )
    }

    await connection.execute(
      'UPDATE quiz_attempts SET score = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [score, attemptId],
    )

    const [[{ durationSeconds }]] = await connection.execute(
      `SELECT ${DURATION_SQL} AS durationSeconds FROM quiz_attempts WHERE id = ?`,
      [attemptId],
    )

    await connection.commit()

    return {
      saved: true,
      score,
      total: gradedAnswers.length,
      durationSeconds,
      // The first attempt is not a "new highscore" – there was no record to beat
      newHighscore: previousBest !== null && isBetter({ score, durationSeconds }, previousBest),
      previousBest,
      answers: gradedAnswers,
    }
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}
//#endregion


//#region Submit
// Logged in with a saved quiz: grade and save. Everyone else: grade only.
// user is null for guests. attemptId is null for guests and quizzes started before logging in.
async function submitResults({ attemptId, difficulty, answers }, user) {
  if (user && attemptId) {
    return saveResult(user.id, attemptId, difficulty, answers)
  }
  return gradeGuestAnswers(difficulty, answers)
}
//#endregion


module.exports = {
  submitResults,
  getStats,
}
