<script setup>
import { computed, ref } from 'vue'
import { avatars, useProfile } from '@/composables/useProfile'

const { profile, updateProfile } = useProfile()
const editing = ref(false)
const pending = ref(false)
const error = ref('')
const notice = ref('')
const name = ref('')
const selectedAvatar = ref(null)

// The avatar shown in the big circle: the chosen one while editing, otherwise the saved one
const shownAvatar = computed(() =>
  editing.value ? avatars.find((avatar) => avatar.id === selectedAvatar.value) : profile.value.avatar,
)
const initial = computed(() => (editing.value ? name.value : profile.value.displayName).trim()[0]?.toUpperCase() || '?')
const memberSince = computed(() =>
  profile.value.createdAt
    ? new Date(profile.value.createdAt).toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })
    : null,
)

function startEditing() {
  name.value = profile.value.displayName
  selectedAvatar.value = profile.value.avatar?.id ?? null
  error.value = ''
  notice.value = ''
  editing.value = true
}

function cancel() {
  error.value = ''
  editing.value = false
}

async function save() {
  if (pending.value) return
  const trimmed = name.value.trim().replace(/\s+/g, ' ')
  if (!trimmed || [...trimmed].length > 40) {
    error.value = 'Namnet måste innehålla 1–40 tecken.'
    return
  }

  pending.value = true
  error.value = ''
  try {
    await updateProfile({ name: trimmed, avatar: selectedAvatar.value })
    editing.value = false
    notice.value = 'Din profil är sparad.'
  } catch {
    error.value = 'Det gick inte att spara profilen. Försök igen.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section class="profile-info">
    <!-- AVATAR -->
    <div
      class="profile-info__avatar"
      :class="{ 'profile-info__avatar--emoji': shownAvatar }"
      :style="shownAvatar && { background: shownAvatar.color }"
      aria-hidden="true"
    >
      {{ shownAvatar?.emoji ?? initial }}
    </div>

    <!-- VIEW -->
    <div v-if="!editing" class="profile-info__content">
      <div class="profile-info__text">
        <h2>{{ profile.displayName }}</h2>
        <p>{{ profile.email }}</p>
        <p v-if="memberSince" class="profile-info__since">Medlem sedan {{ memberSince }}</p>
      </div>
      <button class="profile-info__edit" type="button" @click="startEditing">✎ Redigera profil</button>
      <p v-if="notice" class="profile-info__message profile-info__message--success" role="status">{{ notice }}</p>
    </div>

    <!-- EDIT -->
    <form v-else class="profile-info__form" :aria-busy="pending" @submit.prevent="save">
      <div v-if="error" class="profile-info__message profile-info__message--error" role="alert">{{ error }}</div>

      <span id="profile-avatar-label" class="profile-info__label">Välj avatar</span>
      <div class="profile-info__avatars" role="radiogroup" aria-labelledby="profile-avatar-label">
        <button
          class="profile-info__choice profile-info__choice--letter"
          type="button"
          role="radio"
          title="Första bokstaven"
          aria-label="Första bokstaven i namnet"
          :aria-checked="selectedAvatar === null"
          :disabled="pending"
          @click="selectedAvatar = null"
        >{{ initial }}</button>
        <button
          v-for="avatar in avatars"
          :key="avatar.id"
          class="profile-info__choice"
          type="button"
          role="radio"
          :title="avatar.label"
          :aria-label="avatar.label"
          :aria-checked="selectedAvatar === avatar.id"
          :style="{ background: avatar.color }"
          :disabled="pending"
          @click="selectedAvatar = avatar.id"
        >{{ avatar.emoji }}</button>
      </div>

      <label class="profile-info__label" for="profile-name">Visningsnamn</label>
      <input id="profile-name" v-model="name" type="text" maxlength="40" autocomplete="nickname" required :readonly="pending" />

      <div class="profile-info__actions">
        <button class="profile-info__button" type="submit" :disabled="pending">{{ pending ? 'Sparar…' : 'Spara' }}</button>
        <button class="profile-info__button profile-info__button--ghost" type="button" :disabled="pending" @click="cancel">Avbryt</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.profile-info {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

/* AVATAR */
.profile-info__avatar {
  width: 112px;
  height: 112px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 4px solid white;
  border-radius: 50%;
  background: var(--color-primary-light);
  box-shadow: 0 0 0 2px var(--color-primary-light), var(--shadow-small);
  color: var(--color-primary-dark);
  font-size: 44px;
  font-weight: 700;

  &.profile-info__avatar--emoji {
    font-size: 58px;
  }
}

/* VIEW */
.profile-info__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 112px;
}

.profile-info__text {
  min-width: 0;

  h2 {
    margin-bottom: 4px;
    font-size: 26px;
    overflow-wrap: anywhere;
  }

  p {
    color: var(--color-text-secondary);
    font-size: 15px;
    overflow-wrap: anywhere;
  }

  .profile-info__since {
    margin-top: 6px;
    color: var(--color-primary);
    font-size: 13px;
    font-weight: 700;
  }
}

.profile-info__edit {
  padding: 10px 18px;
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  background: white;
  color: var(--color-primary-dark);
  font-size: 13px;
  font-weight: 700;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
  }
}

/* EDIT */
.profile-info__form {
  flex: 1;
  min-width: 0;
  max-width: 420px;
  display: flex;
  flex-direction: column;
}

.profile-info__label {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 700;
}

input[type='text'] {
  width: 100%;
  min-height: 44px;
  margin-bottom: 18px;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  background: var(--color-surface-soft);
  color: var(--color-text);
  font-size: 16px;
}

.profile-info__avatars {
  margin-bottom: 18px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: 8px;
}

.profile-info__choice {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border: 2px solid transparent;
  border-radius: 50%;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: scale(1.08);
  }

  &[aria-checked='true'] {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
  }

  &.profile-info__choice--letter {
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
    font-size: 18px;
    font-weight: 700;
  }
}

.profile-info__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.profile-info__button {
  min-height: 40px;
  padding: 0 20px;
  display: inline-flex;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 999px;
  background: var(--color-primary);
  color: white;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--color-primary-dark);
  }

  &.profile-info__button--ghost {
    border-color: var(--color-border-strong);
    background: white;
    color: var(--color-text);

    &:hover {
      background: var(--color-surface-soft);
    }
  }
}

input:focus-visible,
button:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 3px;
}

button:disabled {
  opacity: 0.65;
  cursor: wait;
}

.profile-info__message {
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: var(--radius-small);
  font-size: 14px;
}

.profile-info__content .profile-info__message {
  flex-basis: 100%;
  margin-bottom: 0;
}

.profile-info__message--error {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}

.profile-info__message--success {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}

/* MOBILE */
@media (max-width: 700px) {
  .profile-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-info__content {
    flex-direction: column;
    min-height: 0;
  }

  .profile-info__form {
    width: 100%;
    text-align: left;
  }
}
</style>
