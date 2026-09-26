<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import logoImage from '@/assets/images/worldwarden-logo.png'
import { useAuth } from '@/composables/useAuth'

const props = defineProps({ mode: { type: String, default: 'login' } })
const emit = defineEmits(['close'])
const auth = useAuth()
const mode = ref(props.mode)
const dialog = ref(null)
const emailInput = ref(null)
const passwordInput = ref(null)
const email = ref('')
const password = ref('')
const confirmation = ref('')
const pending = ref(false)
const error = ref('')
const notice = ref('')
const showPassword = ref(false)
const registering = computed(() => mode.value === 'signup')
let previousOverflow

onMounted(() => {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.value.showModal()
  emailInput.value.focus()
})

onBeforeUnmount(() => {
  dialog.value.close()
  document.body.style.overflow = previousOverflow
})

function close() {
  if (!pending.value) emit('close')
}

function trapFocus(event) {
  const controls = dialog.value.querySelectorAll('button:not(:disabled), input:not(:disabled)')
  const first = controls[0]
  const last = controls[controls.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

async function switchMode() {
  mode.value = registering.value ? 'login' : 'signup'
  password.value = ''
  confirmation.value = ''
  error.value = ''
  notice.value = ''
  showPassword.value = false
  await nextTick()
  emailInput.value.focus()
}

async function submit() {
  if (pending.value) return
  error.value = ''
  notice.value = ''
  const length = [...password.value].length
  if (registering.value && (length < 5 || length > 128 || !/[0-9]/.test(password.value) || !/[\p{P}\p{S}]/u.test(password.value))) {
    error.value = 'Lösenordet måste innehålla 5–128 tecken, minst en siffra och en symbol.'
    passwordInput.value.focus()
    return
  }
  if (registering.value && password.value !== confirmation.value) {
    error.value = 'Lösenorden matchar inte.'
    return
  }

  pending.value = true
  try {
    const credentials = { email: email.value, password: password.value }
    if (registering.value) {
      await auth.register(credentials)
      await switchMode()
      notice.value = 'Ditt konto är skapat! Logga in för att fortsätta.'
      passwordInput.value.focus()
    } else {
      await auth.login(credentials)
      emit('close')
    }
  } catch (err) {
    error.value = err.message
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="auth-dialog"
      aria-labelledby="auth-title"
      aria-describedby="auth-description"
      @cancel.prevent="close"
      @click.self="close"
      @keydown.tab="trapFocus"
    >
      <div class="auth-dialog__content">
        <button class="auth-dialog__close" type="button" aria-label="Stäng" :disabled="pending" @click="close">
          <span aria-hidden="true">×</span>
        </button>
        <img class="auth-dialog__logo" :src="logoImage" alt="" />
        <p class="auth-dialog__brand">WorldWarden</p>
        <h2 id="auth-title">{{ registering ? 'Skapa ditt konto' : 'Välkommen tillbaka' }}</h2>
        <p id="auth-description" class="auth-dialog__description">
          {{ registering ? 'Din resa runt världen börjar här.' : 'Logga in och fortsätt din resa.' }}
        </p>

        <form class="auth-dialog__form" :aria-busy="pending" @submit.prevent="submit">
          <div v-if="error" class="auth-dialog__message auth-dialog__message--error" role="alert">{{ error }}</div>
          <div v-if="notice" class="auth-dialog__message auth-dialog__message--success" role="status">{{ notice }}</div>

          <label for="auth-email">E-postadress</label>
          <input
            id="auth-email"
            ref="emailInput"
            v-model.trim="email"
            name="email"
            type="email"
            autocomplete="username"
            autocapitalize="none"
            :spellcheck="false"
            placeholder="namn@exempel.se"
            maxlength="254"
            required
            :readonly="pending"
          />

          <label for="auth-password">Lösenord</label>
          <div class="auth-dialog__password">
            <input
              id="auth-password"
              ref="passwordInput"
              v-model="password"
              name="password"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="registering ? 'new-password' : 'current-password'"
              :aria-describedby="registering ? 'auth-password-hint' : undefined"
              required
              :readonly="pending"
            />
            <button
              type="button"
              :aria-label="showPassword ? 'Dölj lösenord' : 'Visa lösenord'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >{{ showPassword ? 'Dölj' : 'Visa' }}</button>
          </div>
          <p v-if="registering" id="auth-password-hint" class="auth-dialog__hint">5–128 tecken, minst en siffra och en symbol, till exempel ! eller #.</p>

          <template v-if="registering">
            <label for="auth-confirmation">Bekräfta lösenord</label>
            <input
              id="auth-confirmation"
              v-model="confirmation"
              name="confirmation"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              required
              :readonly="pending"
            />
          </template>

          <button class="auth-dialog__submit" type="submit" :disabled="pending">
            {{ pending ? 'Vänta…' : registering ? 'Skapa konto' : 'Logga in' }}
          </button>
        </form>

        <p class="auth-dialog__switch">
          {{ registering ? 'Har du redan ett konto?' : 'Har du inget konto?' }}
          <button type="button" :disabled="pending" @click="switchMode">
            {{ registering ? 'Logga in' : 'Skapa konto' }}
          </button>
        </p>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.auth-dialog {
  width: min(460px, calc(100% - 32px));
  max-height: calc(100dvh - 32px);
  margin: auto;
  padding: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-large);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: 0 24px 80px rgb(0 0 0 / 0.25);
}

.auth-dialog::backdrop {
  background: rgb(5 34 42 / 0.65);
  backdrop-filter: blur(4px);
}

.auth-dialog__content {
  position: relative;
  padding: 28px 32px;
  text-align: center;
}

.auth-dialog__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: var(--color-surface-soft);
  color: var(--color-text-secondary);
  font-size: 28px;
}

.auth-dialog__logo {
  width: 68px;
  height: 68px;
  object-fit: contain;
}

.auth-dialog__brand {
  margin: 4px 0 18px;
  color: var(--color-primary-dark);
  font-size: 14px;
  font-weight: 700;
}

h2 {
  margin-bottom: 8px;
  font-size: 26px;
}

.auth-dialog__description {
  margin-bottom: 24px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.auth-dialog__form {
  display: flex;
  flex-direction: column;
  text-align: left;
}

label {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 700;
}

input {
  width: 100%;
  min-height: 48px;
  margin-bottom: 18px;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  background: var(--color-surface-soft);
  color: var(--color-text);
  font-size: 16px;
}

input:focus-visible,
button:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 3px;
}

.auth-dialog__password {
  position: relative;
}

.auth-dialog__password input {
  padding-right: 70px;
}

.auth-dialog__password button {
  position: absolute;
  top: 4px;
  right: 6px;
  min-height: 40px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--color-primary-dark);
  font-size: 13px;
  font-weight: 700;
}

.auth-dialog__hint {
  margin: -8px 0 18px;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.auth-dialog__submit {
  min-height: 48px;
  margin-top: 4px;
  border: 0;
  border-radius: 999px;
  background: var(--color-primary);
  color: white;
  font-weight: 700;
}

.auth-dialog__submit:hover {
  background: var(--color-primary-dark);
}

.auth-dialog__switch {
  margin: 22px 0 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.auth-dialog__switch button {
  min-height: 44px;
  padding: 0 4px;
  border: 0;
  background: transparent;
  color: var(--color-primary-dark);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.auth-dialog__message {
  margin-bottom: 18px;
  padding: 12px;
  border-radius: var(--radius-small);
  font-size: 14px;
  line-height: 1.5;
}

.auth-dialog__message--error {
  background: #fff0ed;
  color: #9e3020;
}

.auth-dialog__message--success {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}

button:disabled {
  opacity: 0.65;
  cursor: wait;
}

@media (max-width: 480px) {
  .auth-dialog__content {
    padding: 24px;
  }
}
</style>
