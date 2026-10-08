<script setup>
import { inject } from 'vue'
import { useAuth } from '@/composables/useAuth'

defineProps({
  title: { type: String, required: true },
  tagline: { type: String, required: true },
  message: { type: String, required: true },
})

const openAuth = inject('openAuth')
const { pending } = useAuth()
</script>

<template>
  <!-- Shown on the account pages while loading or when logged out -->
  <section class="login-required">
    <div class="login-required__header">
      <h2>{{ title }}</h2>
      <p>{{ tagline }}</p>
    </div>

    <p v-if="pending" class="login-required__message">Laddar…</p>

    <div v-else class="login-required__message">
      <div class="login-required__icon">🔒</div>
      <strong>{{ message }}</strong>
      <span>Din profil och dina spelade quiz sparas på ditt konto.</span>
      <button class="login-required__button" type="button" @click="openAuth('login')">Logga in</button>
    </div>
  </section>
</template>

<style scoped>
.login-required {
  padding: 22px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-small);
}

.login-required__header {
  margin-bottom: 20px;

  h2 {
    margin-bottom: 6px;
    font-size: 24px;
  }

  p {
    color: var(--color-primary);
    font-size: 16px;
    font-weight: 700;
  }
}

.login-required__message {
  padding: 36px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  color: var(--color-text-secondary);

  strong {
    color: var(--color-text);
    font-size: 15px;
  }

  span {
    font-size: 13px;
  }
}

.login-required__icon {
  font-size: 40px;
}

.login-required__button {
  margin-top: 6px;
  padding: 10px 24px;
  border: none;
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
}

/* MOBILE */
@media (max-width: 700px) {
  .login-required {
    padding: 18px;
  }
}
</style>
