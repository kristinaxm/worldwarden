// useMedals.js – which medals the logged-in user has unlocked
//
// The backend decides which medals are unlocked (GET /api/profile/medals ->
// { unlocked: ['quiz-beginner-bronze', ...] }). The ids match MEDALS in medals.js.
// POST /api/results also sends newMedals – the medals that quiz unlocked – which are
// shown as popups with announceMedals.

import { computed, ref, watch } from 'vue'
import { request } from '@/api'
import { useAuth } from '@/composables/useAuth'
import { MEDALS } from '@/medals'

// How long a popup stays before it closes by itself
const POPUP_MS = 10_000

// Shared by all components
const unlockedIds = ref(new Set())
const error = ref('')
// Medals shown as popups right now
const popups = ref([])

function setUnlockedMedals(ids) {
  unlockedIds.value = new Set(ids)
}

async function loadMedals() {
  error.value = ''
  try {
    setUnlockedMedals((await request('/profile/medals')).unlocked)
  } catch (err) {
    // Logged out (for example the session expired) – nothing to show
    if (err.status === 401) return setUnlockedMedals([])
    error.value = 'Det gick inte att hämta dina medaljer. Försök igen om en stund.'
  }
}

function dismissPopup(id) {
  popups.value = popups.value.filter((medal) => medal.id !== id)
}

function dismissAllPopups() {
  popups.value = []
}

// Shows a popup for each new medal. If several tiers of the same level were unlocked at
// once (10/10 on the first try gives bronze, silver and gold), only the best one is shown.
function announceMedals(ids) {
  const newMedals = MEDALS.filter((medal) => ids.includes(medal.id))
  const best = newMedals.filter(
    (medal) =>
      !medal.difficulty ||
      !newMedals.some((other) => other.difficulty === medal.difficulty && other.tier > medal.tier),
  )

  setUnlockedMedals([...unlockedIds.value, ...ids])
  popups.value = [...popups.value, ...best]
  for (const medal of best) setTimeout(() => dismissPopup(medal.id), POPUP_MS)
}

export function useMedals() {
  const { user } = useAuth()

  // Fetch when someone logs in (and every time a component using medals is shown, so a
  // finished quiz is counted). Clear when logging out, so the next user doesn't see them.
  watch(
    () => user.value?.id,
    (userId) => {
      if (userId) return loadMedals()
      setUnlockedMedals([])
      dismissAllPopups()
    },
    { immediate: true },
  )

  function isUnlocked(id) {
    return unlockedIds.value.has(id)
  }

  const unlockedCount = computed(() => MEDALS.filter((medal) => isUnlocked(medal.id)).length)

  return {
    isUnlocked,
    unlockedCount,
    error,
    loadMedals,
    popups,
    announceMedals,
    dismissPopup,
    dismissAllPopups,
  }
}
