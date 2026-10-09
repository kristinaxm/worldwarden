import { computed, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { watch } from 'vue'

// Avatarer man kan välja mellan. Profilen sparar bara id:t.
export const avatars = [
  { id: 'globe', emoji: '🌍', label: 'Jordglob', color: '#e3f2f4' },
  { id: 'compass', emoji: '🧭', label: 'Kompass', color: '#fdf0d5' },
  { id: 'map', emoji: '🗺️', label: 'Karta', color: '#e8f3e1' },
  { id: 'plane', emoji: '✈️', label: 'Flygplan', color: '#e4ecfb' },
  { id: 'mountain', emoji: '🏔️', label: 'Berg', color: '#eceff4' },
  { id: 'volcano', emoji: '🌋', label: 'Vulkan', color: '#fbe5dc' },
  { id: 'island', emoji: '🏝️', label: 'Ö', color: '#dff4ef' },
  { id: 'statue', emoji: '🗽', label: 'Frihetsgudinnan', color: '#dcf1ea' },
  { id: 'tower', emoji: '🗼', label: 'Eiffeltornet', color: '#f6e4e4' },
  { id: 'penguin', emoji: '🐧', label: 'Pingvin', color: '#e6eef6' },
  { id: 'kangaroo', emoji: '🦘', label: 'Känguru', color: '#f8ead9' },
  { id: 'panda', emoji: '🐼', label: 'Panda', color: '#eef0ee' },
]

const displayName = ref('')
const avatarId = ref(null)
const email = ref('')

export function useProfile() {
  const { user, logout, setUser } = useAuth()

  watch(user, (newUser) => {
    if (newUser) {
      displayName.value = newUser.display_name || ''
      avatarId.value = newUser.avatar || null
      email.value = newUser.email || ''
    }
  }, { immediate: true })

  const profile = computed(() => {
    const currentEmail = email.value || user.value?.email || ''
    return {
      displayName: displayName.value || currentEmail.split('@')[0],
      email: currentEmail,
      avatar: avatars.find((avatar) => avatar.id === avatarId.value) ?? null,
      createdAt: user.value?.createdAt ?? null,
    }
  })

  async function updateProfile({ name, avatar }) {
    const res = await fetch('http://localhost:3000/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ displayName: name, avatar }),
  })
  if (!res.ok) throw new Error('Profilen kunde inte uppdateras!')
      const data = await res.json()
    displayName.value = data.user.display_name || ''
    avatarId.value = data.user.avatar
    setUser(data.user)
  }


  async function changeEmail({ newEmail, password }) {
    const res = await fetch('http://localhost:3000/api/profile/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: newEmail, password }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'E-postadressen kunde inte uppdateras!')
    }
    const data = await res.json()
    email.value = data.user.email
    setUser(data.user)
  }

  async function changePassword({ currentPassword, newPassword }) {
    const res = await fetch('http://localhost:3000/api/profile/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Kunde inte byta lösenord')
  }
    return res.json()
  }


  async function deleteAccount({ password }) {
  const res = await fetch('http://localhost:3000/api/profile', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Kunde inte radera kontot')
  }
  await logout()
}

  return {
    profile,
    updateProfile,
    changeEmail,
    changePassword,
    deleteAccount,
  }
}
