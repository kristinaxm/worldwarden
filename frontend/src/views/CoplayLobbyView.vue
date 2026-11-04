<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import LoginRequired from '@/components/LoginRequired.vue'
import { request } from '@/api'

const router = useRouter()
const { user, pending: authPending } = useAuth()

const difficulties = [
  { key: 'beginner', label: 'Nybörjare' },
  { key: 'medium', label: 'Medel' },
  { key: 'advanced', label: 'Avancerad' },
  { key: 'expert', label: 'Expert' },
]

const difficulty = ref('beginner')
const joinCode = ref('')
const room = ref(null)
const players = ref([])
const isHost = ref(false)
const pending = ref(false)
const error = ref('')
let poll

const label = computed(() => difficulties.find((item) => item.key === room.value?.difficulty)?.label ?? '')

function stopPolling() {
  clearInterval(poll)
  poll = null
}
onBeforeUnmount(stopPolling)

// Alla i lobbyn pollar: spelarlistan uppdateras och alla skickas vidare när värden startar
function startPolling(code) {
  stopPolling()
  poll = setInterval(async () => {
    try {
      const lobby = await request(`/coplay/${code}`)
      players.value = lobby.players
      if (lobby.started) {
        stopPolling()
        router.push({ name: 'coplay-quiz', params: { code } })
      }
    } catch {
      // En misslyckad poll visas inte: nästa lyckas oftast
    }
  }, 2000)
}

function describe(err, fallback) {
  if (err.status === 403) return 'Den här nivån är låst. Samla mer XP för att låsa upp den.'
  return err.message || fallback
}

async function host() {
  if (pending.value) return
  pending.value = true
  error.value = ''
  try {
    const created = await request('/coplay', { difficulty: difficulty.value })
    room.value = created
    isHost.value = true
    const lobby = await request(`/coplay/${created.code}`)
    players.value = lobby.players
    startPolling(created.code)
  } catch (err) {
    error.value = describe(err, 'Det gick inte att skapa spelet. Försök igen.')
  } finally {
    pending.value = false
  }
}

async function join() {
  if (pending.value) return
  pending.value = true
  error.value = ''
  const code = joinCode.value.trim().toUpperCase()
  try {
    const joined = await request(`/coplay/${code}/join`, {})
    room.value = joined
    isHost.value = joined.isHost
    const lobby = await request(`/coplay/${code}`)
    players.value = lobby.players
    startPolling(code)
  } catch (err) {
    error.value = describe(err, 'Det gick inte att gå med. Kontrollera koden.')
  } finally {
    pending.value = false
  }
}

async function start() {
  if (pending.value) return
  pending.value = true
  error.value = ''
  try {
    await request(`/coplay/${room.value.code}/start`, {})
    stopPolling()
    router.push({ name: 'coplay-quiz', params: { code: room.value.code } })
  } catch (err) {
    error.value = describe(err, 'Det gick inte att starta spelet.')
  } finally {
    pending.value = false
  }
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(room.value.code)
  } catch {
    // Urklipp kan vara blockerat; koden syns ändå på skärmen
  }
}
</script>

<template>
  <LoginRequired
    v-if="!user && !authPending"
    title="Spela tillsammans"
    tagline="Tävla mot dina vänner i samma quiz."
    message="Logga in för att vara med i ett gemensamt spel."
  />

  <section v-else class="coplay">
    <header class="coplay__header">
      <h2>Spela tillsammans</h2>
      <p>Alla i spelet får exakt samma frågor. Bäst resultat vinner.</p>
    </header>

    <div v-if="error" class="coplay__message" role="alert">{{ error }}</div>

    <!-- Lobbyn: väntar på att värden startar -->
    <div v-if="room" class="coplay__lobby">
      <p class="coplay__label">Spelkod</p>
      <div class="coplay__code">
        <strong>{{ room.code }}</strong>
        <button type="button" @click="copyCode">Kopiera</button>
      </div>
      <p class="coplay__hint">Dela koden med dina vänner. Nivå: {{ label }}</p>

      <h3>Spelare ({{ players.length }})</h3>
      <ul class="coplay__players">
        <li v-for="player in players" :key="player.id">{{ player.name }}</li>
      </ul>

      <button v-if="isHost" class="coplay__primary" type="button" :disabled="pending" @click="start">
        {{ pending ? 'Startar…' : 'Starta spelet' }}
      </button>
      <p v-else class="coplay__hint">Väntar på att värden startar spelet…</p>
    </div>

    <!-- Starta ett nytt spel eller gå med med en kod -->
    <div v-else class="coplay__start">
      <div class="coplay__card">
        <h3>Starta ett spel</h3>
        <label for="coplay-difficulty">Välj nivå</label>
        <select id="coplay-difficulty" v-model="difficulty" :disabled="pending">
          <option v-for="item in difficulties" :key="item.key" :value="item.key">{{ item.label }}</option>
        </select>
        <button class="coplay__primary" type="button" :disabled="pending" @click="host">
          {{ pending ? 'Skapar…' : 'Skapa spel' }}
        </button>
      </div>

      <form class="coplay__card" @submit.prevent="join">
        <h3>Gå med i ett spel</h3>
        <label for="coplay-code">Spelkod</label>
        <input
          id="coplay-code"
          v-model="joinCode"
          maxlength="6"
          placeholder="ABC123"
          autocapitalize="characters"
          :spellcheck="false"
          required
          :readonly="pending"
        />
        <button class="coplay__primary" type="submit" :disabled="pending">
          {{ pending ? 'Går med…' : 'Gå med' }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.coplay {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.coplay__header {
  margin-bottom: 24px;
  text-align: center;
}

.coplay__header p {
  margin-top: 8px;
  color: var(--color-text-secondary);
}

.coplay__message {
  margin-bottom: 18px;
  padding: 12px;
  border-radius: var(--radius-small);
  background: #fff0ed;
  color: #9e3020;
  font-size: 14px;
}

.coplay__start {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.coplay__card,
.coplay__lobby {
  display: flex;
  flex-direction: column;
  padding: 22px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-large);
  background: var(--color-surface);
}

.coplay__card h3,
.coplay__lobby h3 {
  margin-bottom: 14px;
}

label {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 700;
}

select,
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

#coplay-code {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 4px;
  text-align: center;
  text-transform: uppercase;
}

.coplay__primary {
  min-height: 48px;
  margin-top: auto;
  border: 0;
  border-radius: 999px;
  background: var(--color-primary);
  color: white;
  font-weight: 700;
}

.coplay__primary:hover {
  background: var(--color-primary-dark);
}

.coplay__primary:disabled {
  opacity: 0.65;
  cursor: wait;
}

.coplay__label {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.coplay__code {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 6px 0 10px;
}

.coplay__code strong {
  font-size: 38px;
  letter-spacing: 8px;
}

.coplay__code button {
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-soft);
  color: var(--color-primary-dark);
  font-weight: 700;
}

.coplay__hint {
  margin-bottom: 18px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.coplay__players {
  margin: 0 0 20px;
  padding: 0;
  list-style: none;
}

.coplay__players li {
  padding: 10px 12px;
  border-radius: var(--radius-small);
  background: var(--color-surface-soft);
}

.coplay__players li + li {
  margin-top: 8px;
}

button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 3px;
}
</style>
