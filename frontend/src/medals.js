// All medals shown on the profile page, in the order they are shown.
// The id is the same as the image name without "medal-" and ".png"
// (quiz-beginner-bronze -> src/assets/images/medals/medal-quiz-beginner-bronze.png).
// The backend decides which medals are unlocked and sends back these ids.

const LEVEL_NAMES = {
  beginner: 'Nybörjare',
  medium: 'Medel',
  advanced: 'Avancerad',
  expert: 'Expert',
}

// A higher score also unlocks the lower tiers: 10/10 gives bronze, silver and gold
const TIERS = [
  { id: 'bronze', name: 'Brons', score: 'minst 6 rätt' },
  { id: 'silver', name: 'Silver', score: 'minst 8 rätt' },
  { id: 'gold', name: 'Guld', score: '10/10 rätt' },
]

const COMPLETED_COUNTS = [10, 20, 30, 50]

// difficulty and tier (0 = bronze, 2 = gold) are used to show only the best new medal per level
const levelMedals = Object.entries(LEVEL_NAMES).flatMap(([difficulty, levelName]) =>
  TIERS.map((tier, tierIndex) => ({
    id: `quiz-${difficulty}-${tier.id}`,
    difficulty,
    tier: tierIndex,
    name: `${levelName} ${tier.name}`,
    requirement: `Få ${tier.score} på ett quiz på ${levelName}.`,
  })),
)

const completedMedals = COMPLETED_COUNTS.map((count) => ({
  id: `quiz-completed-${count}`,
  name: `${count} quiz`,
  requirement: `Genomför totalt ${count} quiz.`,
}))

export const MEDALS = [
  ...levelMedals,
  ...completedMedals,
  { id: 'quiz-worldwarden', name: 'WorldWarden', requirement: 'Lås upp alla 12 nivåmedaljer.' },
  { id: 'quiz-4perfect', name: 'Fyra perfekta', requirement: 'Få 10/10 minst en gång på alla fyra nivåerna.' },
]

// Every png in the medals folder, keyed by file name: { 'medal-quiz-4perfect': url, ... }
const images = Object.fromEntries(
  Object.entries(import.meta.glob('@/assets/images/medals/*.png', { eager: true, import: 'default' })).map(
    ([path, url]) => [path.split('/').pop().replace('.png', ''), url],
  ),
)

export function medalImage(id) {
  return images[`medal-${id}`] ?? null
}
