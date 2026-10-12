// useXp.js – XP-data för spelaren
//
// ⚠️ MOCK-DATA just nu – kopplas till backend när endpoint finns.
// Kollegan byter ut:
//   - totalXp (ref) → fetch från GET /api/profile/xp
//   - loadXp() → riktigt anrop
//   - leveledUp → från backend-svaret efter quiz
//
// Inget annat behöver ändras – komponenterna använder samma API.

import { computed, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

// ─────────────────────────────────────────────
// STATE (mock – byts mot backend)
// ─────────────────────────────────────────────

// Total XP för inloggad användare
// TODO: hämta från backend

const totalXp = ref(650)

// XP-trösklar per nivå (bestämt i US-15)
const LEVEL_THRESHOLDS = [
    { level: 1, name: 'Nybörjare', min: 0, max: 499 },
    { level: 2, name: 'Medel', min: 500, max: 1299 },
    { level: 3, name: 'Avancerad', min: 1300, max: 2999 },
    { level: 4, name: 'Expert', min: 3000, max: Infinity },
]

// ─────────────────────────────────────────────
// COMPOSABLE
// ─────────────────────────────────────────────

export function useXp() {
    const { user } = useAuth()

    // Är användaren inloggad?
    const isLoggedIn = computed(() => !!user.value)

    // Nuvarande nivå (baserat på totalXp)
    const currentLevel = computed(() => {
        return LEVEL_THRESHOLDS.find(
            (level) => totalXp.value >= level.min && totalXp.value <= level.max
        ) ?? LEVEL_THRESHOLDS[0]
    })

    // Nästa nivå (eller null om man är maxad)
    const nextLevel = computed(() => {
        const next = LEVEL_THRESHOLDS.find(
            (lvl) => lvl.level === currentLevel.value.level + 1)
    return next ?? null
  })

  // XP inom nuvarande nivå (0 → max-min)
  const xpInLevel = computed(() => totalXp.value - currentLevel.value.min)

  // Hur många XP nivån kräver totalt (max - min + 1)
  const xpForLevel = computed(() => currentLevel.value.max - currentLevel.value.min + 1)

  // XP som krävs för nästa nivå (max - total)
  const xpToNextLevel = computed(() => {
    if (!nextLevel.value) return 0
    return nextLevel.value.min - totalXp.value
  })

  // Progress i procent för progressbaren (0 → 100)
  const progress = computed(() => {
    if (!nextLevel.value) return 100
    const xpForNextLevel = nextLevel.value.min
    return Math.min(100, Math.round((totalXp.value / xpForNextLevel) * 100))
})

   // ─────────────────────────────────────────────
  // MOCK: Hämta XP från backend (senare)
  // ─────────────────────────────────────────────
  // TODO: Byt ut hela funktionen mot riktigt fetch-anrop
  //
  // async function loadXp() {
  //   const res = await fetch('/api/profile/xp', { credentials: 'include' })
  //   const data = await res.json()
  //   totalXp.value = data.xp
  // }
  async function loadXp() {
   

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
        loadXp,
    }
}