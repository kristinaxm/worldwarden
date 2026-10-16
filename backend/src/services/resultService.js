const { pool } = require('../db.js')
const countryService = require('./countryService.js')
const { httpError } = require('../httpError.js')
const { LEVELS } = require('../quizLevels.js')
const { calculateXp, levelForXp, xpSummary } = require('../xpLevels.js')
const xpService = require('./xpService.js')

const normalize = (value) => value?.trim().toLocaleLowerCase('sv-SE') ?? ''


//#region Grading
// questions: the correct country for each question – [{ number, code, name, capital, usedHint }]
// answers: what the user answered – [{ number, country }] or [{ number, capital }]
// The level decides which answer field to read and what the correct answer is
// (beginner: country / country name, medium: capital / capital).
function gradeAnswers(difficulty, questions, answers) {
  const level = LEVELS[difficulty]

  return questions.map((question) => {
    const answer = answers.find((item) => item.number === question.number)
    const givenAnswer = answer[level.answerField]
    const correctAnswer = level.correctAnswer(question)
    const matches = ['advanced', 'expert'].includes(difficulty)
      ? normalize(givenAnswer) === normalize(correctAnswer)
      : givenAnswer === correctAnswer

    return {
      number: question.number,
      flagCode: question.code.toLowerCase(),
      answer: givenAnswer,
      correct: matches && (!level.capitalAnswer || normalize(answer.capital) === normalize(level.capitalAnswer(question))),
      correctAnswer,
      ...(level.capitalAnswer ? { capitalAnswer: answer.capital, correctCapital: level.capitalAnswer(question) } : {}),
      // Set by the server when the hint was fetched (POST /api/questions/hint), never by the client
      usedHint: Boolean(question.usedHint),
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
      return { number: answer.number, code: country.code, name: country.name, capital: country.capital, continent: country.continent }
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
    xp: null, // guests don't collect XP
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

    // Locks the user, so two quizzes submitted at the same time can't both read the same
    // XP total before and report the same level-up twice
    await connection.execute('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId])

    // FOR UPDATE locks the row, so the same quiz can't be submitted twice at the same time
    const [[attempt]] = await connection.execute(
      'SELECT user_id, difficulty, completed_at FROM quiz_attempts WHERE id = ? FOR UPDATE',
      [attemptId],
    )
    if (!attempt || attempt.user_id !== userId) throw httpError(404, 'Quiz not found')
    if (attempt.completed_at) throw httpError(409, 'Quiz is already finished')
    if (attempt.difficulty !== difficulty) throw httpError(400, 'Difficulty does not match the quiz')

    const [questions] = await connection.execute(
      `SELECT quiz_answers.question_number AS number, quiz_answers.used_hint AS usedHint,
              countries.code, countries.name, countries.capital, countries.continent
       FROM quiz_answers JOIN countries ON countries.id = quiz_answers.country_id
       WHERE quiz_answers.attempt_id = ?
       ORDER BY quiz_answers.question_number`,
      [attemptId],
    )

    const gradedAnswers = gradeAnswers(difficulty, questions, answers)
    const score = countCorrect(gradedAnswers)
    const xpEarned = calculateXp(difficulty, gradedAnswers)

    // Must be read before this quiz is marked as finished, otherwise it compares with itself
    const previousBest = await findBest(connection, userId, difficulty)
    const xpBefore = await xpService.getTotalXp(connection, userId)

    for (const answer of gradedAnswers) {
  await connection.execute(
    'UPDATE quiz_answers SET country_answer = ?, capital_answer = ?, is_correct = ? WHERE attempt_id = ? AND question_number = ?',
    [
      answer.answer,                       
      answer.capitalAnswer ?? null,
      answer.correct ? 1 : 0,
      attemptId,
      answer.number,
    ],
  )
}

    await connection.execute(
      'UPDATE quiz_attempts SET score = ?, xp = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [score, xpEarned, attemptId],
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
      xp: {
        earned: xpEarned,
        ...xpSummary(xpBefore + xpEarned),
        leveledUp: levelForXp(xpBefore + xpEarned).level > levelForXp(xpBefore).level,
      },
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


async function getHistory(userId, difficulty) {
  const [rows] = await pool.execute(
    `SELECT a.id, a.difficulty, a.score, a.total_questions AS total, a.xp,
            TIMESTAMPDIFF(SECOND, a.started_at, a.completed_at) AS durationSeconds,
            a.completed_at AS completedAt, q.question_number AS number,
            q.country_answer, q.capital_answer, q.is_correct AS correct,
            c.code, c.name, c.capital, c.continent
     FROM quiz_attempts a
     JOIN quiz_answers q ON q.attempt_id = a.id
     JOIN countries c ON c.id = q.country_id
     WHERE a.user_id = ? AND a.difficulty = ? AND a.completed_at IS NOT NULL
     ORDER BY a.completed_at DESC, a.id DESC, q.question_number`,
    [userId, difficulty],
  )
  const results = new Map()
  const level = LEVELS[difficulty]

  for (const row of rows) {
    if (!results.has(row.id)) {
      results.set(row.id, {
        id: row.id,
        difficulty: row.difficulty,
        score: row.score,
        total: row.total,
        xpEarned: row.xp,
        durationSeconds: row.durationSeconds,
        completedAt: row.completedAt,
        answers: [],
      })
    }
    results.get(row.id).answers.push({
      number: row.number,
      flagCode: row.code.toLowerCase(),
      answer: row[level.answerColumn],
      correct: Boolean(row.correct),
      correctAnswer: level.correctAnswer(row),
      ...(level.capitalAnswer ? { capitalAnswer: row.capital_answer, correctCapital: level.capitalAnswer(row) } : {}),
    })
  }

  return [...results.values()]
}

module.exports = {
  submitResults,
  getStats,
  getHistory,
}
