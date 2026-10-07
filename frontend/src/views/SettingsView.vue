<script setup>
import AccountSettings from '@/components/AccountSettings.vue'
import LoginRequired from '@/components/LoginRequired.vue'
import { useAuth } from '@/composables/useAuth'

const { user, pending } = useAuth()
</script>

<template>
  <LoginRequired
    v-if="pending || !user"
    title="Kontoinställningar"
    tagline="Byt e-postadress, lösenord eller radera kontot."
    message="Logga in för att ändra dina inställningar"
  />

  <section v-else class="settings-card">
    <div class="settings-header">
      <h2>Kontoinställningar</h2>
      <p>Byt e-postadress, lösenord eller radera kontot.</p>
    </div>
    <AccountSettings />
  </section>
</template>

<style scoped>
.settings-card {
  padding: 22px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-small);
}

/* PAGE HEADER */
.settings-header {
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

/* MOBILE */
@media (max-width: 700px) {
  .settings-card {
    padding: 18px;
  }
}
</style>
