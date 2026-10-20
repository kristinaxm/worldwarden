// useMedals.js – which medals the logged-in user has unlocked
//
// The backend will decide which medals are unlocked. When it is connected: fetch the ids
// (for example GET /api/profile/medals -> { unlocked: ['quiz-beginner-bronze', ...] })
// and pass them to setUnlockedMedals instead of DEMO_UNLOCKED.

import { computed, ref, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { MEDALS } from '@/medals'

// Demo data so the unlocked look can be seen. Remove when the backend is connected.
const DEMO_UNLOCKED = [
  'quiz-beginner-bronze',
  'quiz-beginner-silver',
  'quiz-beginner-gold',
  'quiz-medium-bronze',
  'quiz-completed-10',
]

// Shared by all components
const unlockedIds = ref(new Set())

function setUnlockedMedals(ids) {
  unlockedIds.value = new Set(ids)
}

export function useMedals() {
  const { user } = useAuth()

  // Clear when logging out, so the next user doesn't see someone else's medals
  watch(
    () => user.value?.id,
    (userId) => setUnlockedMedals(userId ? DEMO_UNLOCKED : []),
    { immediate: true },
  )

  function isUnlocked(id) {
    return unlockedIds.value.has(id)
  }

  const unlockedCount = computed(() => MEDALS.filter((medal) => isUnlocked(medal.id)).length)

  return {
    isUnlocked,
    unlockedCount,
    setUnlockedMedals,
  }
}
