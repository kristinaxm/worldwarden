// useXp.js – XP-data för spelaren, hämtas från GET /api/profile/xp
//
// Backend räknar ut all XP, nivån och vilka svårighetsgrader som är upplåsta.
// Här räknas bara det som behövs för att visa progressbaren.
// Gäster samlar ingen XP och kan bara spela nybörjare.

import { computed, ref, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'

// ─────────────────────────────────────────────
// STATE (delas av alla komponenter)
// ─────────────────────────────────────────────

const GUEST_DIFFICULTIES = ['beginner']

// Svaret från backend: { totalXp, level, nextLevel, unlockedDifficulties, levels }
const summary = ref(null)
const loading = ref(false)
const error = ref('')

// Om flera komponenter laddar samtidigt görs bara ett anrop
let pendingLoad = null

async function fetchXp() {
  let response
  try {
    response = await fetch('/api/profile/xp', {
      credentials: 'include',
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new Error('Det gick inte att hämta din XP. Försök igen om en stund.')
  }

  // Utloggad (t.ex. sessionen gick ut) – ingen XP att visa
  if (response.status === 401) return null
  if (!response.ok) throw new Error('Det gick inte att hämta din XP. Försök igen om en stund.')
  return response.json()
}

async function loadXp() {
  if (pendingLoad) return pendingLoad

  loading.value = true
  error.value = ''
  pendingLoad = fetchXp()
    .then((data) => {
      summary.value = data
    })
    .catch((err) => {
      error.value = err.message
    })
    .finally(() => {
      loading.value = false
      pendingLoad = null
    })

  return pendingLoad
}

// Används efter ett quiz: svaret från POST /api/results har samma XP-data under "xp"
function setXp(xp) {
  if (xp) summary.value = xp
}

function resetXp() {
  summary.value = null
  error.value = ''
}

// ─────────────────────────────────────────────
// COMPOSABLE
// ─────────────────────────────────────────────

export function useXp() {
  const { user } = useAuth()

  // Hämta XP när någon loggar in (och varje gång en komponent som använder XP visas),
  // töm när man loggar ut
  watch(
    () => user.value?.id,
    (userId) => (userId ? loadXp() : resetXp()),
    { immediate: true },
  )

  const isLoggedIn = computed(() => !!user.value)

  const totalXp = computed(() => summary.value?.totalXp ?? 0)

  // Nuvarande nivå: { level, name, minXp, maxXp } (maxXp är null på högsta nivån)
  const currentLevel = computed(() => summary.value?.level ?? { level: 1, name: 'Nybörjare', minXp: 0, maxXp: 499 })

  // Nästa nivå (eller null om man är maxad)
  const nextLevel = computed(() => summary.value?.nextLevel ?? null)

  // XP inom nuvarande nivå
  const xpInLevel = computed(() => totalXp.value - currentLevel.value.minXp)

  // Hur många XP nivån kräver totalt
  const xpForLevel = computed(() => {
    if (!nextLevel.value) return 0
    return nextLevel.value.minXp - currentLevel.value.minXp
  })

  // XP som krävs för nästa nivå
  const xpToNextLevel = computed(() => {
    if (!nextLevel.value) return 0
    return nextLevel.value.minXp - totalXp.value
  })

  // Progress i procent för progressbaren (0 → 100)
  const progress = computed(() => {
    if (!nextLevel.value) return 100
    return Math.min(100, Math.round((xpInLevel.value / xpForLevel.value) * 100))
  })

  // Svårighetsgrader man får spela. Gäster: bara nybörjare.
  const unlockedDifficulties = computed(() => {
    if (!user.value) return GUEST_DIFFICULTIES
    return summary.value?.unlockedDifficulties ?? GUEST_DIFFICULTIES
  })

  function isUnlocked(difficulty) {
    return unlockedDifficulties.value.includes(difficulty)
  }

  // Nivån som låser upp en svårighetsgrad, t.ex. { level: 2, name: 'Medel', minXp: 500 }
  function levelThatUnlocks(difficulty) {
    return summary.value?.levels.find((level) => level.unlocks === difficulty) ?? null
  }

  return {
    totalXp,
    isLoggedIn,
    currentLevel,
    nextLevel,
    xpInLevel,
    xpForLevel,
    xpToNextLevel,
    progress,
    unlockedDifficulties,
    isUnlocked,
    levelThatUnlocks,
    loading,
    error,
    loadXp,
    setXp,
  }
}
