<script setup>
import { RouterLink } from 'vue-router'
import LoginRequired from '@/components/LoginRequired.vue'
import ProfileInfo from '@/components/ProfileInfo.vue'
import { useAuth } from '@/composables/useAuth'

const { user, pending } = useAuth()
</script>

<template>
  <div class="profile">
    <LoginRequired
      v-if="pending || !user"
      title="Min profil"
      tagline="Ditt namn och din profilbild."
      message="Logga in för att se din profil"
    />

    <template v-else>
      <!-- PROFILE INFO -->
      <section class="profile-card">
        <ProfileInfo />
      </section>

      <!-- SHORTCUTS -->
      <nav class="profile-links" aria-label="Mitt konto">
        <RouterLink :to="{ name: 'results' }" class="profile-link">
          <span class="profile-link__icon">☆</span>
          <span class="profile-link__text">
            <strong>Mina resultat</strong>
            <small>Se hur det gick – fråga för fråga.</small>
          </span>
          <span class="profile-link__arrow" aria-hidden="true">›</span>
        </RouterLink>

        <RouterLink :to="{ name: 'settings' }" class="profile-link">
          <span class="profile-link__icon">⚙</span>
          <span class="profile-link__text">
            <strong>Kontoinställningar</strong>
            <small>Byt e-postadress, lösenord eller radera kontot.</small>
          </span>
          <span class="profile-link__arrow" aria-hidden="true">›</span>
        </RouterLink>
      </nav>
    </template>
  </div>
</template>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.profile-card {
  padding: 22px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-small);
}

/* SHORTCUTS */
.profile-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.profile-link {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-small);
  color: var(--color-text);
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.1);

    .profile-link__arrow {
      background: var(--color-primary);
      color: white;
    }
  }

  &:focus-visible {
    outline: 3px solid var(--color-primary);
    outline-offset: 3px;
  }
}

.profile-link__icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 20px;
}

.profile-link__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    font-size: 16px;
  }

  small {
    color: var(--color-text-secondary);
    font-size: 13px;
  }
}

.profile-link__arrow {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 20px;
  font-weight: 700;
  transition: background 0.15s ease, color 0.15s ease;
}

/* MOBILE */
@media (max-width: 700px) {
  .profile-card {
    padding: 18px;
  }

  .profile-links {
    grid-template-columns: 1fr;
  }
}
</style>
