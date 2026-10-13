import { onScopeDispose, ref, watch } from 'vue'
import { request } from '@/api'
import { useAuth } from '@/composables/useAuth'

const levels = {
  beginner: { category: 'Flaggor', difficulty: 'Nybörjare' },
  medium: { category: 'Huvudstäder', difficulty: 'Medel' },
}

export function useResults(difficulty = 'beginner') {
  const { user } = useAuth()
  const results = ref([])
  const loading = ref(false)
  const error = ref('')
  let version = 0

  async function load() {
    const current = ++version
    results.value = []
    error.value = ''
    loading.value = Boolean(user.value)
    if (!user.value) return

    try {
      const data = await request(`/results?difficulty=${difficulty}`)
      if (current !== version) return
      results.value = data.map((result) => {
        let streak = 0
        let bestStreak = 0
        for (const answer of result.answers) {
          streak = answer.correct ? streak + 1 : 0
          bestStreak = Math.max(bestStreak, streak)
        }
        const minutes = Math.floor(result.durationSeconds / 60)
        const seconds = result.durationSeconds % 60
        return {
          ...levels[result.difficulty],
          id: result.id,
          playedAt: result.completedAt,
          score: result.score,
          wrong: result.total - result.score,
          totalQuestions: result.total,
          percentage: Math.round(result.score / result.total * 100),
          bestStreak,
          time: minutes ? `${minutes} min ${seconds} s` : `${seconds} s`,
          questions: result.answers.map((answer) => ({
            ...answer,
            image: `https://flagcdn.com/w80/${answer.flagCode}.png`,
          })),
        }
      })
    } catch {
      if (current === version) error.value = 'Det gick inte att hämta resultaten. Försök igen.'
    } finally {
      if (current === version) loading.value = false
    }
  }

  watch(() => user.value?.id, load, { immediate: true })
  onScopeDispose(() => version++)

  return { results, loading, error, load }
}
