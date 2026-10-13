// XP rules (US-18). Everything about how XP is earned and what the player levels unlock lives here.
// The server is the only place XP is calculated, so it can't be cheated from the browser.

// XP for each correct answer. A correct answer after using a hint gives half.
// All four difficulties are listed, also the ones that can't be played yet (see quizLevels.js),
// so a new quiz level gets XP as soon as it is added there.
const XP_PER_CORRECT = {
  beginner: 50,
  medium: 100,
  advanced: 150,
  expert: 200,
}

// Extra XP for 10/10 correct, also when hints were used
const PERFECT_BONUS = 50

// Player levels. Level n unlocks difficulty n. maxXp is null for the highest level.
const PLAYER_LEVELS = [
  { level: 1, name: 'Nybörjare', minXp: 0, maxXp: 499, unlocks: 'beginner' },
  { level: 2, name: 'Medel', minXp: 500, maxXp: 1299, unlocks: 'medium' },
  { level: 3, name: 'Avancerad', minXp: 1300, maxXp: 2999, unlocks: 'advanced' },
  { level: 4, name: 'Expert', minXp: 3000, maxXp: null, unlocks: 'expert' },
]

// Guests don't collect XP and can only play this difficulty
const GUEST_DIFFICULTIES = ['beginner']

// gradedAnswers: [{ correct, usedHint }] from resultService
function calculateXp(difficulty, gradedAnswers) {
  const perCorrect = XP_PER_CORRECT[difficulty]
  let xp = 0

  for (const answer of gradedAnswers) {
    if (!answer.correct) continue
    xp += answer.usedHint ? Math.floor(perCorrect / 2) : perCorrect
  }

  const allCorrect = gradedAnswers.length > 0 && gradedAnswers.every((answer) => answer.correct)
  return allCorrect ? xp + PERFECT_BONUS : xp
}

function levelForXp(totalXp) {
  return PLAYER_LEVELS.findLast((level) => totalXp >= level.minXp)
}

function unlockedDifficulties(totalXp) {
  return PLAYER_LEVELS.filter((level) => totalXp >= level.minXp).map((level) => level.unlocks)
}

// What the frontend needs to show XP, level and locks
function xpSummary(totalXp) {
  const level = levelForXp(totalXp)

  return {
    totalXp,
    level,
    nextLevel: PLAYER_LEVELS.find((next) => next.level === level.level + 1) || null,
    unlockedDifficulties: unlockedDifficulties(totalXp),
    levels: PLAYER_LEVELS,
  }
}

module.exports = {
  XP_PER_CORRECT,
  PERFECT_BONUS,
  PLAYER_LEVELS,
  GUEST_DIFFICULTIES,
  calculateXp,
  levelForXp,
  unlockedDifficulties,
  xpSummary,
}
