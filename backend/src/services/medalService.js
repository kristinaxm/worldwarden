const { pool } = require('../db.js')
const { unlockedMedals } = require('../medals.js')

// Best score, whether any quiz was 10/10, and how many quizzes had at least half correct,
// per difficulty. Unfinished quizzes are ignored.
// db is either the pool or a connection inside a transaction.
async function getStats(db, userId) {
  const [rows] = await db.execute(
    `SELECT difficulty, COUNT(*) AS completedCount, SUM(score >= 5) AS qualifyingCount,
            MAX(score) AS bestScore,
            MAX(score = total_questions) AS perfect
     FROM quiz_attempts
     WHERE user_id = ? AND completed_at IS NOT NULL
     GROUP BY difficulty`,
    [userId],
  )

  return {
    completedCount: rows.reduce((sum, row) => sum + Number(row.completedCount), 0),
    qualifyingCount: rows.reduce((sum, row) => sum + Number(row.qualifyingCount), 0),
    levels: Object.fromEntries(
      rows.map((row) => [row.difficulty, { bestScore: row.bestScore, perfect: Boolean(row.perfect) 
      }]),
    ),
  }
}

async function getUnlockedIds(db, userId) {
  return unlockedMedals(await getStats(db, userId))
}

// GET /api/profile/medals
async function getUnlocked(userId) {
  return { unlocked: await getUnlockedIds(pool, userId) }
}

module.exports = {
  getUnlockedIds,
  getUnlocked,
}
