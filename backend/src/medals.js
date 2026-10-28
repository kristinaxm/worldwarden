// Medal rules. The ids must match frontend/src/medals.js (and the image names there).
// Medals are never stored – like XP they are calculated from the finished quizzes,
// so old quizzes count too.

const DIFFICULTIES = ['beginner', 'medium', 'advanced', 'expert']

// Minimum correct answers for each tier. A higher score also unlocks the lower tiers,
// so 10/10 gives bronze, silver and gold. Gold needs every question correct.
const TIERS = [
  { id: 'bronze', minScore: 6 },
  { id: 'silver', minScore: 8 },
  { id: 'gold', perfect: true },
]

// Number of finished quizzes with at least half correct (all difficulties together)
const COMPLETED_COUNTS = [10, 20, 30, 50]

const LEVEL_MEDALS = DIFFICULTIES.flatMap((difficulty) => TIERS.map((tier) => `quiz-${difficulty}-${tier.id}`))

// stats: { completedCount, levels: { beginner: { bestScore, perfect }, ... } }
// A difficulty that has never been played is missing from levels.
function unlockedMedals(stats) {
  const unlocked = []

  for (const difficulty of DIFFICULTIES) {
    const level = stats.levels[difficulty]
    if (!level) continue

    for (const tier of TIERS) {
      if (tier.perfect ? level.perfect : level.bestScore >= tier.minScore) {
        unlocked.push(`quiz-${difficulty}-${tier.id}`)
      }
    }
  }

  for (const count of COMPLETED_COUNTS) {
    if (stats.qualifyingCount >= count) unlocked.push(`quiz-completed-${count}`)
  }

  if (LEVEL_MEDALS.every((id) => unlocked.includes(id))) unlocked.push('quiz-worldwarden')
  if (DIFFICULTIES.every((difficulty) => stats.levels[difficulty]?.perfect)) unlocked.push('quiz-4perfect')

  return unlocked
}

module.exports = {
  unlockedMedals,
}
