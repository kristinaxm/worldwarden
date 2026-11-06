<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useXp } from '@/composables/useXp'
import { useMedals } from '@/composables/useMedals'
import { request } from '@/api'

const route = useRoute()
const router = useRouter()
const { setXp, loadXp } = useXp()
const { announceMedals } = useMedals()

const code = computed(() => String(route.params.code || '').toUpperCase())

const questions = ref([])
const difficulty = ref('')
const attemptId = ref(null)
const current = ref(1)
const answeredCount = ref(0)
const playerCount = ref(0)
const isHost = ref(false)
const hasAnswered = ref(false)
const countryAnswer = ref('')
const capitalAnswer = ref('')
const finished = ref(false)
const scores = ref(null)
const pending = ref(true)
const advancing = ref(false)
const showExitModal = ref(false)
const leaving = ref(false)
const error = ref('')
let statePoll
let scorePoll

const question = computed(() => questions.value[current.value - 1] || null)
const isExpert = computed(() => difficulty.value === 'expert')
const isTyped = computed(() => ['advanced', 'expert'].includes(difficulty.value))
const flagUrl = computed(() => (question.value ? `https://flagcdn.com/w640/${question.value.flagCode}.png` : ''))
const isLast = computed(() => current.value >= questions.value.length)
const answeredPercent = computed(() =>
  playerCount.value ? Math.round((answeredCount.value / playerCount.value) * 100) : 0,
)
const allAnswered = computed(() => playerCount.value > 0 && answeredCount.value >= playerCount.value)

function stopPolling() {
  clearInterval(statePoll)
  clearInterval(scorePoll)
  statePoll = null
  scorePoll = null
}
onBeforeUnmount(stopPolling)

// Alla pollar rummet: värden styr vilken fråga som visas, så alla följer med
async function loadState() {
  try {
    const state = await request(`/coplay/${code.value}/state`)
    answeredCount.value = state.answered
    playerCount.value = state.players
    isHost.value = state.isHost

    if (state.finished) {
      submit()
      return
    }
    if (state.currentQuestion !== current.value) {
      current.value = state.currentQuestion
      hasAnswered.value = false
      countryAnswer.value = ''
      capitalAnswer.value = ''
    }
  } catch {
    // Nästa poll försöker igen
  }
}

async function answer(value) {
  if (hasAnswered.value || !question.value) return
  hasAnswered.value = true
  try {
    await request(`/coplay/${code.value}/answer`, {
      number: question.value.number,
      country: isTyped.value ? (countryAnswer.value.trim() || null) : value,
      ...(isExpert.value ? { capital: capitalAnswer.value.trim() || null } : {}),
    })
    loadState()
  } catch {
    // Låt spelaren försöka igen om svaret inte gick fram
    hasAnswered.value = false
  }
}

async function next() {
  if (advancing.value) return
  advancing.value = true
  try {
    await request(`/coplay/${code.value}/next`, {})
    await loadState()
  } catch (err) {
    error.value = err.message || 'Det gick inte att gå vidare.'
  } finally {
    advancing.value = false
  }
}

// Värden avslutar för alla, en spelare lämnar bara sitt eget spel. Båda
// lämnar in det spelaren hunnit svara på, så resultatet finns kvar i ställningen.
async function confirmExit() {
  if (leaving.value) return
  leaving.value = true
  showExitModal.value = false
  try {
    if (isHost.value) await request(`/coplay/${code.value}/end`, {})
  } catch {
    // Avbröts det för de andra eller inte: spelaren ska ändå ut ur quizet
  }
  await submit()
  leaving.value = false
}

// Hämtar spelarens sparade svar och lämnar in dem som ett vanligt quiz
async function submit() {
  if (finished.value) return
  finished.value = true
  stopPolling()
  pending.value = true
  try {
    const saved = await request(`/coplay/${code.value}/answers`)
    const byNumber = new Map(saved.map((item) => [item.number, item]))

    const result = await request('/results', {
      attemptId: attemptId.value,
      difficulty: difficulty.value,
      answers: questions.value.map((item) => ({
        number: item.number,
        flagCode: item.flagCode,
        country: byNumber.get(item.number)?.country ?? null,
        ...(isExpert.value ? { capital: byNumber.get(item.number)?.capital ?? null } : {}),
      })),
    })
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
    current.value = quiz.currentQuestion
    await loadState()
    statePoll = setInterval(loadState, 2000)
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
        <span>Fråga {{ current }} av {{ questions.length }}</span>
        <button
          class="cq__close"
          type="button"
          :aria-label="isHost ? 'Avsluta quizet för alla' : 'Lämna quizet'"
          :disabled="leaving"
          @click="showExitModal = true"
        >
          ×
        </button>
      </header>

      <!-- Fylls i grönt för varje spelare som svarat, och blir helgrön när alla svarat -->
      <div
        class="cq__progress"
        :class="{ 'cq__progress--done': allAnswered }"
        role="progressbar"
        :aria-valuenow="answeredCount"
        aria-valuemin="0"
        :aria-valuemax="playerCount"
        :aria-label="`${answeredCount} av ${playerCount} har svarat`"
      >
        <div class="cq__progress-fill" :style="{ width: `${answeredPercent}%` }"></div>
        <span class="cq__progress-text">{{ answeredCount }}/{{ playerCount }} har svarat</span>
      </div>

      <img class="cq__flag" :src="flagUrl" alt="Flagga" />

      <div v-if="!isTyped" class="cq__options">
        <button
          v-for="option in question.options"
          :key="option"
          type="button"
          :disabled="hasAnswered"
          @click="answer(option)"
        >
          {{ option }}
        </button>
      </div>

      <form v-else class="cq__typed" @submit.prevent="answer(null)">
        <label for="cq-country">Land</label>
        <input id="cq-country" v-model="countryAnswer" :spellcheck="false" autocomplete="off" :readonly="hasAnswered" />

        <template v-if="isExpert">
          <label for="cq-capital">Huvudstad</label>
          <input id="cq-capital" v-model="capitalAnswer" :spellcheck="false" autocomplete="off" :readonly="hasAnswered" />
        </template>

        <button type="submit" :disabled="hasAnswered">Svara</button>
      </form>

      <p v-if="hasAnswered" class="cq__waiting-note">Ditt svar är sparat. Väntar på värden…</p>

      <!-- Bara värden går vidare, så alla ser samma fråga samtidigt -->
      <button v-if="isHost" class="cq__next" type="button" :disabled="advancing" @click="next">
        {{ advancing ? 'Går vidare…' : isLast ? 'Avsluta quizet' : 'Nästa fråga' }}
      </button>
    </div>

    <!-- Värden avslutar för alla, en spelare lämnar bara sitt eget spel -->
    <Teleport to="body">
      <div v-if="showExitModal" class="cq-exit-backdrop" @click.self="showExitModal = false">
        <div class="cq-exit" role="dialog" aria-modal="true" aria-labelledby="cq-exit-title">
          <h2 id="cq-exit-title">{{ isHost ? 'Avsluta quizet för alla?' : 'Lämna quizet?' }}</h2>
          <p v-if="isHost">
            Spelet avslutas för alla spelare. Det ni hunnit svara på sparas och
            ställningen visas.
          </p>
          <p v-else>
            Du lämnar quizet, men de andra fortsätter spela. Det du hunnit svara
            på sparas.
          </p>
          <div class="cq-exit__actions">
            <button type="button" class="cq-exit__stay" @click="showExitModal = false">
              Fortsätt spela
            </button>
            <button type="button" class="cq-exit__leave" :disabled="leaving" @click="confirmExit">
              {{ isHost ? 'Avsluta för alla' : 'Lämna quizet' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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
  gap: 12px;
  margin-bottom: 16px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.cq__close {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-soft);
  color: var(--color-text);
  font-size: 22px;
  line-height: 1;
}

.cq__close:hover:not(:disabled) {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.cq__close:disabled {
  opacity: 0.6;
  cursor: wait;
}

.cq-exit-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--color-backdrop);
  backdrop-filter: blur(3px);
}

.cq-exit {
  width: min(440px, 100%);
  padding: 32px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
  box-shadow: 0 24px 60px rgb(0 0 0 / 0.2);
  text-align: center;
}

.cq-exit p {
  margin-top: 10px;
  color: var(--color-text-secondary);
  font-size: 15px;
}

.cq-exit__actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.cq-exit__actions button {
  flex: 1;
  min-height: 48px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-soft);
  color: var(--color-text);
  font-weight: 700;
}

.cq-exit__actions .cq-exit__leave {
  border-color: transparent;
  background: var(--color-danger);
  color: white;
}

.cq-exit__actions .cq-exit__leave:disabled {
  opacity: 0.65;
  cursor: wait;
}

.cq__progress {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  margin-bottom: 18px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-soft);
}

.cq__progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--color-success);
  transition: width 0.3s ease;
}

.cq__progress-text {
  position: relative;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 700;
  /* Texten ligger mitt i stapeln och hamnar därför delvis ovanpå den gröna
     fyllningen. Konturen gör den läsbar mot båda bakgrunderna. */
  text-shadow:
    0 0 3px var(--color-surface-soft),
    0 0 3px var(--color-surface-soft),
    0 0 4px var(--color-surface-soft);
}

/* Alla har svarat: hela stapeln grön, med vit text ovanpå */
.cq__progress--done .cq__progress-text {
  color: white;
  text-shadow: none;
}

@media (prefers-reduced-motion: reduce) {
  .cq__progress-fill {
    transition: none;
  }
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

.cq__options button:hover:not(:disabled) {
  background: var(--color-primary-light);
}

.cq__options button:disabled,
.cq__typed button:disabled {
  opacity: 0.6;
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
.cq__actions button,
.cq__next {
  min-height: 48px;
  padding: 0 20px;
  border: 0;
  border-radius: 999px;
  background: var(--color-primary);
  color: white;
  font-weight: 700;
}

.cq__typed button:hover,
.cq__actions button:hover,
.cq__next:hover {
  background: var(--color-primary-dark);
}

.cq__next {
  width: 100%;
  margin-top: 20px;
}

.cq__waiting-note {
  margin-top: 16px;
  color: var(--color-text-secondary);
  font-size: 14px;
  text-align: center;
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
