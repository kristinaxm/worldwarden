<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useXp } from '@/composables/useXp'
import { useMedals } from '@/composables/useMedals'
import { request } from '@/api'

// Sekunder per fråga. När tiden tar slut går quizet vidare av sig själv,
// så alla spelare hinner lika länge på varje fråga.
const SECONDS_PER_QUESTION = 20

const route = useRoute()
const router = useRouter()
const { setXp, loadXp } = useXp()
const { announceMedals } = useMedals()

const code = computed(() => String(route.params.code || '').toUpperCase())

const questions = ref([])
const difficulty = ref('')
const attemptId = ref(null)
const index = ref(0)
const answers = ref([])
const countryAnswer = ref('')
const capitalAnswer = ref('')
const secondsLeft = ref(SECONDS_PER_QUESTION)
const finished = ref(false)
const scores = ref(null)
const pending = ref(true)
const error = ref('')
let tick
let scorePoll

const question = computed(() => questions.value[index.value] || null)
const isExpert = computed(() => difficulty.value === 'expert')
const isTyped = computed(() => ['advanced', 'expert'].includes(difficulty.value))
const flagUrl = computed(() => (question.value ? `https://flagcdn.com/w640/${question.value.flagCode}.png` : ''))

function stopTimers() {
  clearInterval(tick)
  clearInterval(scorePoll)
  tick = null
  scorePoll = null
}
onBeforeUnmount(stopTimers)

function startCountdown() {
  clearInterval(tick)
  secondsLeft.value = SECONDS_PER_QUESTION
  tick = setInterval(() => {
    secondsLeft.value -= 1
    if (secondsLeft.value <= 0) answer(null)
  }, 1000)
}

// Sparar svaret på den aktuella frågan och går vidare, eller avslutar quizet
function answer(value) {
  if (finished.value || !question.value) return
  const current = question.value

  answers.value.push({
    number: current.number,
    flagCode: current.flagCode,
    country: isTyped.value ? (countryAnswer.value.trim() || null) : value,
    ...(isExpert.value ? { capital: capitalAnswer.value.trim() || null } : {}),
  })

  countryAnswer.value = ''
  capitalAnswer.value = ''

  if (index.value + 1 >= questions.value.length) {
    submit()
    return
  }
  index.value += 1
  startCountdown()
}

async function submit() {
  stopTimers()
  finished.value = true
  pending.value = true
  try {
    const result = await request('/results', {
      attemptId: attemptId.value,
      difficulty: difficulty.value,
      answers: answers.value,
    })
    // Samma XP- och medaljhantering som ett vanligt quiz
    if (result.xp) {
      setXp(result.xp)
      loadXp()
    }
    if (result.newMedals?.length) announceMedals(result.newMedals)
  } catch (err) {
    if (err.status !== 409) error.value = 'Det gick inte att spara resultatet.'
  } finally {
    pending.value = false
    loadScores()
    // Ställningen fylls på medan de andra spelar klart
    scorePoll = setInterval(loadScores, 3000)
  }
}

async function loadScores() {
  try {
    scores.value = await request(`/coplay/${code.value}/scores`)
    if (scores.value.players.every((player) => player.finished)) {
      clearInterval(scorePoll)
      scorePoll = null
    }
  } catch {
    // Ställningen uppdateras vid nästa försök
  }
}

onMounted(async () => {
  try {
    const quiz = await request(`/coplay/${code.value}/questions`)
    questions.value = quiz.questions
    difficulty.value = quiz.difficulty
    attemptId.value = quiz.attemptId
    startCountdown()
  } catch (err) {
    error.value = err.message || 'Det gick inte att hämta frågorna.'
  } finally {
    pending.value = false
  }
})
</script>

<template>
  <section class="cq">
    <div v-if="error" class="cq__message" role="alert">{{ error }}</div>

    <p v-else-if="pending && !questions.length" class="cq__loading">Laddar frågor…</p>

    <!-- Resultat och placering -->
    <div v-else-if="finished" class="cq__result">
      <h2>Resultat</h2>
      <p v-if="pending" class="cq__loading">Sparar ditt resultat…</p>

      <ol v-if="scores" class="cq__scores">
        <li v-for="player in scores.players" :key="player.id" class="cq__score">
          <span class="cq__place">{{ player.place ?? '–' }}</span>
          <span class="cq__name">{{ player.name }}</span>
          <span v-if="player.finished" class="cq__points">{{ player.score }}/{{ player.total }}</span>
          <span v-else class="cq__waiting">spelar…</span>
        </li>
      </ol>

      <p class="cq__hint">Quizet är sparat under Mina resultat, som ett vanligt quiz.</p>
      <div class="cq__actions">
        <button type="button" @click="router.push({ name: 'results' })">Mina resultat</button>
        <button type="button" @click="router.push({ name: 'coplay' })">Spela igen</button>
      </div>
    </div>

    <!-- Frågorna -->
    <div v-else-if="question" class="cq__question">
      <header class="cq__top">
        <span>Fråga {{ index + 1 }} av {{ questions.length }}</span>
        <span class="cq__timer" :class="{ 'cq__timer--low': secondsLeft <= 5 }">{{ secondsLeft }}s</span>
      </header>

      <img class="cq__flag" :src="flagUrl" alt="Flagga" />

      <div v-if="!isTyped" class="cq__options">
        <button v-for="option in question.options" :key="option" type="button" @click="answer(option)">
          {{ option }}
        </button>
      </div>

      <form v-else class="cq__typed" @submit.prevent="answer(null)">
        <label for="cq-country">Land</label>
        <input id="cq-country" v-model="countryAnswer" :spellcheck="false" autocomplete="off" />

        <template v-if="isExpert">
          <label for="cq-capital">Huvudstad</label>
          <input id="cq-capital" v-model="capitalAnswer" :spellcheck="false" autocomplete="off" />
        </template>

        <button type="submit">Svara</button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.cq {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.cq__message {
  padding: 12px;
  border-radius: var(--radius-small);
  background: #fff0ed;
  color: #9e3020;
}

.cq__loading {
  color: var(--color-text-secondary);
  text-align: center;
}

.cq__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.cq__timer {
  min-width: 56px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--color-surface-soft);
  font-weight: 700;
  text-align: center;
}

.cq__timer--low {
  background: #fff0ed;
  color: #9e3020;
}

.cq__flag {
  width: 100%;
  margin-bottom: 22px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-large);
}

.cq__options {
  display: grid;
  gap: 12px;
}

.cq__options button {
  min-height: 56px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 16px;
  font-weight: 700;
}

.cq__options button:hover {
  background: var(--color-primary-light);
}

.cq__typed {
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 700;
}

input {
  min-height: 48px;
  margin-bottom: 18px;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  background: var(--color-surface-soft);
  color: var(--color-text);
  font-size: 16px;
}

.cq__typed button,
.cq__actions button {
  min-height: 48px;
  padding: 0 20px;
  border: 0;
  border-radius: 999px;
  background: var(--color-primary);
  color: white;
  font-weight: 700;
}

.cq__typed button:hover,
.cq__actions button:hover {
  background: var(--color-primary-dark);
}

.cq__scores {
  margin: 18px 0;
  padding: 0;
  list-style: none;
}

.cq__score {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-small);
  background: var(--color-surface-soft);
}

.cq__score + .cq__score {
  margin-top: 8px;
}

.cq__place {
  min-width: 28px;
  font-size: 18px;
  font-weight: 700;
}

.cq__name {
  flex: 1;
}

.cq__points {
  font-weight: 700;
}

.cq__waiting {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.cq__hint {
  margin-bottom: 18px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.cq__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.cq__actions button:last-child {
  background: var(--color-surface-soft);
  color: var(--color-primary-dark);
}

button:focus-visible,
input:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 3px;
}
</style>
