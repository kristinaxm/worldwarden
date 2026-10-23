<script setup>
import { RouterLink } from 'vue-router'
import { medalImage } from '@/medals'
import { useMedals } from '@/composables/useMedals'

const { popups, dismissPopup, dismissAllPopups } = useMedals()
</script>

<template>
  <!-- Popups for newly unlocked medals. Shown on every page, so it lives in App.vue. -->
  <TransitionGroup tag="div" name="medal-popup" class="medal-popups" role="status" aria-live="polite">
    <div v-for="medal in popups" :key="medal.id" class="medal-popup">
      <img class="medal-popup__image" :src="medalImage(medal.id)" alt="" />

      <div class="medal-popup__text">
        <p class="medal-popup__label">Ny medalj upplåst!</p>
        <strong>{{ medal.name }}</strong>
        <small>{{ medal.requirement }}</small>
        <RouterLink class="medal-popup__link" :to="{ name: 'profile', hash: '#medaljer' }" @click="dismissAllPopups">
          Visa alla mina medaljer ›
        </RouterLink>
      </div>

      <button class="medal-popup__close" type="button" aria-label="Stäng" @click="dismissPopup(medal.id)">✕</button>
    </div>
  </TransitionGroup>
</template>

<style scoped>
.medal-popups {
  position: fixed;
  top: 76px;
  right: 16px;
  z-index: 1000;
  width: min(360px, calc(100vw - 32px));
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.medal-popup {
  position: relative;
  padding: 16px 40px 16px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-medium);
  background: var(--color-accent-light);
  box-shadow: var(--shadow-medium);
  pointer-events: auto;
}

.medal-popup__image {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  object-fit: contain;
  animation: medal-pop 0.6s ease;
}

.medal-popup__text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    font-size: 17px;
  }

  small {
    color: var(--color-text-secondary);
    font-size: 13px;
  }
}

.medal-popup__label {
  color: var(--color-accent-dark);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.medal-popup__link {
  margin-top: 6px;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 700;

  &:hover {
    color: var(--color-primary-dark);
    text-decoration: underline;
  }
}

.medal-popup__close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: white;
    color: var(--color-text);
  }
}

.medal-popup__link:focus-visible,
.medal-popup__close:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 3px;
}

/* SLIDE IN FROM THE RIGHT */
.medal-popup-enter-active,
.medal-popup-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.medal-popup-enter-from,
.medal-popup-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

@keyframes medal-pop {
  0% {
    transform: scale(0.4) rotate(-12deg);
  }
  60% {
    transform: scale(1.15) rotate(4deg);
  }
  100% {
    transform: scale(1);
  }
}

/* MOBILE – at the bottom, so it doesn't cover the buttons at the top of the quiz */
@media (max-width: 700px) {
  .medal-popups {
    top: auto;
    bottom: 16px;
    flex-direction: column-reverse;
  }
}

@media (prefers-reduced-motion: reduce) {
  .medal-popup__image {
    animation: none;
  }
}
</style>
