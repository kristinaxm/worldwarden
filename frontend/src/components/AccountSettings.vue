<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useProfile } from '@/composables/useProfile'

const router = useRouter()
const { profile, changeEmail, changePassword, deleteAccount } = useProfile()

const emailForm = reactive({ newEmail: '', password: '', pending: false, error: '', notice: '' })
const passwordForm = reactive({ current: '', next: '', confirmation: '', pending: false, error: '', notice: '' })
const deleteForm = reactive({ open: false, password: '', pending: false, error: '' })

// Same rules as when creating an account (AuthDialog)
function validPassword(password) {
  const length = [...password].length
  return length >= 5 && length <= 128 && /[0-9]/.test(password) && /[\p{P}\p{S}]/u.test(password)
}

async function submitEmail() {
  if (emailForm.pending) return
  emailForm.error = ''
  emailForm.notice = ''
  const newEmail = emailForm.newEmail.trim().toLowerCase()
  if (newEmail === profile.value.email) {
    emailForm.error = 'Det är redan din e-postadress.'
    return
  }

  emailForm.pending = true
  try {
    await changeEmail({ newEmail, password: emailForm.password })
    emailForm.newEmail = ''
    emailForm.password = ''
    emailForm.notice = 'Din e-postadress är ändrad.'
  } catch {
    emailForm.error = 'Det gick inte att ändra e-postadressen. Försök igen.'
  } finally {
    emailForm.pending = false
  }
}

async function submitPassword() {
  if (passwordForm.pending) return
  passwordForm.error = ''
  passwordForm.notice = ''
  if (!validPassword(passwordForm.next)) {
    passwordForm.error = 'Det nya lösenordet måste innehålla 5–128 tecken, minst en siffra och en symbol.'
    return
  }
  if (passwordForm.next !== passwordForm.confirmation) {
    passwordForm.error = 'De nya lösenorden matchar inte.'
    return
  }
  if (passwordForm.next === passwordForm.current) {
    passwordForm.error = 'Det nya lösenordet måste skilja sig från det nuvarande.'
    return
  }

  passwordForm.pending = true
  try {
    await changePassword({ currentPassword: passwordForm.current, newPassword: passwordForm.next })
    passwordForm.current = ''
    passwordForm.next = ''
    passwordForm.confirmation = ''
    passwordForm.notice = 'Ditt lösenord är bytt.'
  } catch {
    passwordForm.error = 'Det gick inte att byta lösenord. Försök igen.'
  } finally {
    passwordForm.pending = false
  }
}

function closeDelete() {
  deleteForm.open = false
  deleteForm.password = ''
  deleteForm.error = ''
}

async function submitDelete() {
  if (deleteForm.pending) return
  deleteForm.error = ''
  deleteForm.pending = true
  try {
    await deleteAccount({ password: deleteForm.password })
    router.push({ name: 'home' })
  } catch {
    deleteForm.error = 'Det gick inte att radera kontot. Försök igen.'
  } finally {
    deleteForm.pending = false
  }
}
</script>

<template>
  <div class="settings">
    <!-- CHANGE EMAIL -->
    <form class="settings__form" :aria-busy="emailForm.pending" @submit.prevent="submitEmail">
      <h3>Byt e-postadress</h3>
      <p class="settings__description">Nuvarande: <strong>{{ profile.email }}</strong></p>

      <div v-if="emailForm.error" class="settings__message settings__message--error" role="alert">{{ emailForm.error }}</div>
      <div v-if="emailForm.notice" class="settings__message settings__message--success" role="status">{{ emailForm.notice }}</div>

      <label for="settings-email">Ny e-postadress</label>
      <input
        id="settings-email"
        v-model="emailForm.newEmail"
        type="email"
        autocomplete="email"
        autocapitalize="none"
        :spellcheck="false"
        placeholder="namn@exempel.se"
        maxlength="254"
        required
        :readonly="emailForm.pending"
      />

      <label for="settings-email-password">Nuvarande lösenord</label>
      <input
        id="settings-email-password"
        v-model="emailForm.password"
        type="password"
        autocomplete="current-password"
        required
        :readonly="emailForm.pending"
      />

      <button class="settings__submit" type="submit" :disabled="emailForm.pending">
        {{ emailForm.pending ? 'Sparar…' : 'Byt e-postadress' }}
      </button>
    </form>

    <!-- CHANGE PASSWORD -->
    <form class="settings__form" :aria-busy="passwordForm.pending" @submit.prevent="submitPassword">
      <h3>Byt lösenord</h3>
      <p class="settings__description">5–128 tecken, minst en siffra och en symbol, till exempel ! eller #.</p>

      <div v-if="passwordForm.error" class="settings__message settings__message--error" role="alert">{{ passwordForm.error }}</div>
      <div v-if="passwordForm.notice" class="settings__message settings__message--success" role="status">{{ passwordForm.notice }}</div>

      <label for="settings-current-password">Nuvarande lösenord</label>
      <input
        id="settings-current-password"
        v-model="passwordForm.current"
        type="password"
        autocomplete="current-password"
        required
        :readonly="passwordForm.pending"
      />

      <label for="settings-new-password">Nytt lösenord</label>
      <input
        id="settings-new-password"
        v-model="passwordForm.next"
        type="password"
        autocomplete="new-password"
        required
        :readonly="passwordForm.pending"
      />

      <label for="settings-confirm-password">Bekräfta nytt lösenord</label>
      <input
        id="settings-confirm-password"
        v-model="passwordForm.confirmation"
        type="password"
        autocomplete="new-password"
        required
        :readonly="passwordForm.pending"
      />

      <button class="settings__submit" type="submit" :disabled="passwordForm.pending">
        {{ passwordForm.pending ? 'Sparar…' : 'Byt lösenord' }}
      </button>
    </form>

    <!-- DELETE ACCOUNT -->
    <div class="settings__danger">
      <div class="settings__danger-text">
        <h3>Radera konto</h3>
        <p>Ditt konto och alla dina resultat tas bort för alltid. Det går inte att ångra.</p>
      </div>

      <button v-if="!deleteForm.open" class="settings__delete" type="button" @click="deleteForm.open = true">
        Radera konto
      </button>

      <form v-else class="settings__confirm" :aria-busy="deleteForm.pending" @submit.prevent="submitDelete">
        <div v-if="deleteForm.error" class="settings__message settings__message--error" role="alert">{{ deleteForm.error }}</div>

        <label for="settings-delete-password">Skriv ditt lösenord för att bekräfta</label>
        <input
          id="settings-delete-password"
          v-model="deleteForm.password"
          type="password"
          autocomplete="current-password"
          required
          :readonly="deleteForm.pending"
        />

        <div class="settings__confirm-actions">
          <button class="settings__delete settings__delete--filled" type="submit" :disabled="deleteForm.pending">
            {{ deleteForm.pending ? 'Raderar…' : 'Ja, radera mitt konto' }}
          </button>
          <button class="settings__cancel" type="button" :disabled="deleteForm.pending" @click="closeDelete">Avbryt</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.settings {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.settings__form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);

  h3 {
    margin-bottom: 6px;
    font-size: 17px;
  }
}

.settings__description {
  margin-bottom: 18px;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;

  strong {
    color: var(--color-text);
  }
}

label {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 700;
}

input {
  width: 100%;
  min-height: 44px;
  margin-bottom: 16px;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  background: white;
  color: var(--color-text);
  font-size: 16px;
}

input:focus-visible,
button:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 3px;
}

.settings__submit {
  min-height: 44px;
  margin-top: auto;
  border: 0;
  border-radius: 999px;
  background: var(--color-primary);
  color: white;
  font-size: 14px;
  font-weight: 700;
  transition: background 0.15s ease;

  &:hover {
    background: var(--color-primary-dark);
  }

  &:disabled {
    opacity: 0.65;
    cursor: wait;
  }
}

.settings__message {
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: var(--radius-small);
  font-size: 14px;
  line-height: 1.5;
}

.settings__message--error {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}

.settings__message--success {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}

/* DELETE ACCOUNT */
.settings__danger {
  grid-column: 1 / -1;
  padding: 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid var(--color-danger-light);
  border-radius: var(--radius-medium);
  background: var(--color-danger-light);
}

.settings__danger-text {
  flex: 1 1 280px;

  h3 {
    margin-bottom: 6px;
    color: var(--color-danger-dark);
    font-size: 17px;
  }

  p {
    color: var(--color-text-secondary);
    font-size: 13px;
    line-height: 1.5;
  }
}

.settings__confirm {
  flex: 1 1 320px;
  max-width: 420px;
  display: flex;
  flex-direction: column;

  input {
    border-color: var(--color-danger);
  }
}

.settings__confirm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.settings__delete,
.settings__cancel {
  min-height: 44px;
  padding: 0 22px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  transition: background 0.15s ease, color 0.15s ease;

  &:disabled {
    opacity: 0.65;
    cursor: wait;
  }
}

.settings__delete {
  border: 2px solid var(--color-danger);
  background: white;
  color: var(--color-danger-dark);

  &:hover {
    background: var(--color-danger);
    color: white;
  }

  &.settings__delete--filled {
    background: var(--color-danger);
    color: white;

    &:hover {
      background: var(--color-danger-dark);
      border-color: var(--color-danger-dark);
    }
  }
}

.settings__cancel {
  border: 1px solid var(--color-border-strong);
  background: white;
  color: var(--color-text);

  &:hover {
    background: var(--color-surface-soft);
  }
}

/* TABLET + MOBILE */
@media (max-width: 900px) {
  .settings {
    grid-template-columns: 1fr;
  }
}
</style>
