import { readonly, ref } from 'vue'

const user = ref(null)
const pending = ref(true)
const error = ref('')

async function request(path, body) {
  let response
  try {
    response = await fetch(`/api/auth${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'include',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new Error('Det gick inte att nå servern. Försök igen om en stund.')
  }

  if (!response.ok) {
    const messages = {
      400: 'Kontrollera din e-postadress och ditt lösenord.',
      401: 'Fel e-postadress eller lösenord.',
      409: 'E-postadressen är redan registrerad. Logga in i stället.',
      429: 'För många försök. Vänta en stund och försök igen.',
    }
    throw Object.assign(new Error(messages[response.status] || 'Något gick fel. Försök igen om en stund.'), {
      status: response.status,
    })
  }

  if (response.status === 204) return
  try {
    return await response.json()
  } catch {
    throw new Error('Det gick inte att läsa svaret från servern. Försök igen.')
  }
}

async function restore() {
  pending.value = true
  error.value = ''
  try {
    user.value = (await request('/me')).user
  } catch (err) {
    if (err.status === 401) user.value = null
    else error.value = err.message
  } finally {
    pending.value = false
  }
}

async function login(credentials) {
  user.value = (await request('/login', credentials)).user
  error.value = ''
}

async function logout() {
  pending.value = true
  error.value = ''
  try {
    await request('/logout', {})
    user.value = null
  } catch (err) {
    error.value = err.message
  } finally {
    pending.value = false
  }
}

export function useAuth() {
  return {
    user: readonly(user),
    pending: readonly(pending),
    error: readonly(error),
    restore,
    login,
    logout,
    register: (credentials) => request('/signup', credentials),
  }
}
