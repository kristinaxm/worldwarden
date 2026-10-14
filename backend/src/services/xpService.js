const { pool } = require('../db.js')
const { httpError } = require('../httpError.js')
const { GUEST_DIFFICULTIES, PLAYER_LEVELS, unlockedDifficulties, xpSummary } = require('../xpLevels.js')

// Total XP is never stored on its own – it is always the sum of the finished quizzes.
// db is either the pool or a connection inside a transaction.
async function getTotalXp(db, userId) {
  const [[{ totalXp }]] = await db.execute(
    'SELECT COALESCE(SUM(xp), 0) AS totalXp FROM quiz_attempts WHERE user_id = ? AND completed_at IS NOT NULL',
    [userId],
  )
  // SUM() comes back from MySQL as a string
  return Number(totalXp)
}

// GET /api/profile/xp
async function getSummary(userId) {
  return xpSummary(await getTotalXp(pool, userId))
}

// Throws 403 if the difficulty is locked. user is null for guests.
async function assertCanPlay(user, difficulty) {
  if (!user) {
    if (!GUEST_DIFFICULTIES.includes(difficulty)) throw httpError(403, 'Log in to play this difficulty')
    return
  }

  const totalXp = await getTotalXp(pool, user.id)
  if (!unlockedDifficulties(totalXp).includes(difficulty)) {
    const required = PLAYER_LEVELS.find((level) => level.unlocks === difficulty)
    throw httpError(403, `Difficulty is locked until level ${required.level}`)
  }
}

module.exports = {
  getTotalXp,
  getSummary,
  assertCanPlay,
}
