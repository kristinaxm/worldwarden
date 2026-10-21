<script setup>
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { MEDALS, medalImage } from '@/medals'
import { useMedals } from '@/composables/useMedals'

const { isUnlocked, unlockedCount, error, loadMedals } = useMedals()
const route = useRoute()
const card = useTemplateRef('card')
const expanded = ref(false)

// "Visa alla mina medaljer" in the medal popup links to /profil#medaljer:
// open the card and scroll to it (also when already on the profile page)
watch(
  () => route.hash,
  async (hash) => {
    if (hash !== '#medaljer') return
    expanded.value = true
    await nextTick()
    card.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  },
  { immediate: true },
)

// Moves the tooltip sideways so it stays inside the card (the page content clips anything outside).
// Calculated from the medal's center and the tooltip's width, not the tooltip's current position,
// since that is still animating when the mouse enters.
function placeTooltip(event) {
  const medal = event.currentTarget.getBoundingClientRect()
  const tooltip = event.currentTarget.querySelector('.medal__tooltip')
  const bounds = event.currentTarget.closest('.medals-card').getBoundingClientRect()

  const left = medal.left + medal.width / 2 - tooltip.offsetWidth / 2
  const right = left + tooltip.offsetWidth
  const shift = Math.max(bounds.left - left, 0) + Math.min(bounds.right - right, 0)
  tooltip.style.setProperty('--shift', `${shift}px`)
}
</script>

<template>
  <section
    id="medaljer"
    ref="card"
    class="medals-card"
    :class="{ 'medals-card--expanded': expanded }"
    aria-labelledby="medals-title"
  >
    <div class="medals-card__header">
      <div>
        <h3 id="medals-title">Dina medaljer</h3>
        <p>Gör quiz för att låsa upp nya medaljer.</p>
      </div>

      <div class="medals-card__actions">
        <span class="medals-card__count" :aria-label="`${unlockedCount} av ${MEDALS.length} medaljer upplåsta`">
          {{ unlockedCount }} / {{ MEDALS.length }}
        </span>
        <button
          class="medals-card__toggle"
          type="button"
          :aria-expanded="expanded"
          aria-controls="medals-list"
          :aria-label="expanded ? 'Dölj medaljer' : 'Visa medaljer'"
          @click="expanded = !expanded"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>

    <!-- ERROR -->
    <div v-if="error" class="medals-card__error" role="alert">
      <p>{{ error }}</p>
      <button type="button" @click="loadMedals">Försök igen</button>
    </div>

    <!-- MEDALS (the wrapper animates the height when opening and closing) -->
    <div class="medals-card__body" :inert="!expanded || null">
      <ul id="medals-list" class="medals-card__grid">
        <li
          v-for="medal in MEDALS"
          :key="medal.id"
          class="medal"
          :class="{ 'medal--locked': !isUnlocked(medal.id) }"
          tabindex="0"
          :aria-describedby="`medal-tip-${medal.id}`"
          @mouseenter="placeTooltip"
          @focus="placeTooltip"
        >
          <div class="medal__badge">
            <img class="medal__image" :src="medalImage(medal.id)" alt="" />
            <span v-if="!isUnlocked(medal.id)" class="medal__lock" aria-hidden="true">🔒</span>
          </div>
          <strong class="medal__name">{{ medal.name }}</strong>
          <small class="medal__status">{{ isUnlocked(medal.id) ? 'Upplåst' : 'Låst' }}</small>

          <!-- TOOLTIP -->
          <span :id="`medal-tip-${medal.id}`" class="medal__tooltip" role="tooltip">
            {{ medal.requirement }}
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.medals-card {
  padding: 22px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-small);
}

.medals-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  h3 {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    color: var(--color-primary);
  }

  p {
    margin-top: 4px;
    color: var(--color-text-secondary);
    font-size: 14px;
  }
}

.medals-card__actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.medals-card__count {
  padding: 6px 14px;
  border: 1px solid var(--color-accent);
  border-radius: 999px;
  background: var(--color-accent-light);
  color: var(--color-accent-dark);
  font-size: 14px;
  font-weight: 700;
}


.medals-card__toggle {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  background: white;
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  svg {
    transition: transform 0.3s ease;
  }

  &:hover {
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
  }

  &:focus-visible {
    outline: 3px solid var(--color-primary);
    outline-offset: 3px;
  }
}

/* ERROR */
.medals-card__error {
  margin-top: 16px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: var(--radius-small);
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
  font-size: 14px;

  button {
    flex-shrink: 0;
    padding: 6px 14px;
    border: none;
    border-radius: 999px;
    background: var(--color-primary);
    color: white;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      background: var(--color-primary-dark);
    }
  }
}

/* OPEN / CLOSED */
.medals-card__body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease;

  /* Hides the medals while closed */
  > .medals-card__grid {
    min-height: 0;
    overflow: hidden;
  }
}

.medals-card--expanded {
  .medals-card__toggle svg {
    transform: rotate(180deg);
  }

  .medals-card__body {
    grid-template-rows: 1fr;

    /* Tooltips may go outside the list, but only once it is fully open */
    > .medals-card__grid {
      padding-top: 22px;
      animation: show-overflow 0s 0.3s forwards;
    }
  }
}

@keyframes show-overflow {
  to {
    overflow: visible;
  }
}

.medals-card__grid {
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(124px, 1fr));
  gap: 12px;
  list-style: none;
  transition: padding-top 0.3s ease;
}

/* MEDAL */
.medal {
  position: relative;
  padding: 14px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-medium);
  background: var(--color-accent-light);
  text-align: center;
  cursor: default;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover,
  &:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.1);

    .medal__tooltip {
      opacity: 1;
      visibility: visible;
      transform: translate(calc(-50% + var(--shift, 0px)), 0);
    }
  }

  &:focus-visible {
    outline: 3px solid var(--color-primary);
    outline-offset: 3px;
  }

  &.medal--locked {
    border-color: var(--color-border);
    background: var(--color-surface-soft);

    .medal__image {
      filter: grayscale(1);
      opacity: 0.4;
    }

    .medal__name {
      color: var(--color-text-secondary);
    }
  }
}

.medal__badge {
  position: relative;
  width: 72px;
  height: 72px;
  margin-bottom: 6px;
}

.medal__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.medal__lock {
  position: absolute;
  right: -2px;
  bottom: 2px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 2px solid white;
  border-radius: 50%;
  background: var(--color-border);
  font-size: 12px;
}

.medal__name {
  font-size: 14px;
}

.medal__status {
  color: var(--color-text-secondary);
  font-size: 12px;
}

/* TOOLTIP */
.medal__tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  z-index: 10;
  width: max-content;
  max-width: 200px;
  padding: 8px 12px;
  border-radius: var(--radius-small);
  background: var(--color-text);
  box-shadow: var(--shadow-medium);
  color: white;
  font-size: 13px;
  line-height: 1.4;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: translate(calc(-50% + var(--shift, 0px)), 4px);
  transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s;

  /* Arrow pointing down at the medal – moved back by the shift so it stays centered on it */
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: calc(50% - var(--shift, 0px));
    border: 6px solid transparent;
    border-top-color: var(--color-text);
    transform: translateX(-50%);
  }
}

/* MOBILE */
@media (max-width: 700px) {
  .medals-card {
    padding: 18px;
  }

  .medals-card__header {
    align-items: flex-start;
  }

  .medals-card__grid {
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 10px;
  }

  .medal__badge {
    width: 60px;
    height: 60px;
  }

  .medal__tooltip {
    max-width: 160px;
  }
}
</style>
