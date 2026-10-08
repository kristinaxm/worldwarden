import { computed, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

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

// TODO: byt ut mot riktiga anrop när backend har endpoints för profilen.
// Ändringar sparas bara i webbläsaren tills sidan laddas om.
const displayName = ref('')
const avatarId = ref(null)
const email = ref('')

// Låtsas att servern tar en kort stund på sig
const wait = () => new Promise((resolve) => setTimeout(resolve, 400))

export function useProfile() {
  const { user, logout } = useAuth()

  const profile = computed(() => {
    const currentEmail = email.value || user.value?.email || ''
    return {
      displayName: displayName.value || currentEmail.split('@')[0],
      email: currentEmail,
      avatar: avatars.find((avatar) => avatar.id === avatarId.value) ?? null,
      createdAt: user.value?.createdAt ?? null,
    }
  })

  // TODO: PATCH /api/profile { displayName, avatar }
  async function updateProfile({ name, avatar }) {
    await wait()
    displayName.value = name
    avatarId.value = avatar
  }

  // TODO: POST /api/profile/email { email, password } – servern kontrollerar lösenordet
  async function changeEmail({ newEmail }) {
    await wait()
    email.value = newEmail
  }

  // TODO: POST /api/profile/password { currentPassword, newPassword }
  async function changePassword() {
    await wait()
  }

  // TODO: DELETE /api/profile { password } – raderar kontot och alla resultat.
  // Just nu loggas man bara ut.
  async function deleteAccount() {
    await wait()
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
