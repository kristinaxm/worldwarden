<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { request } from '@/api'
import { avatars } from '@/composables/useProfile'
import { MEDALS, medalImage } from '@/medals'

// player: an entry from the leaderboard { id, name, avatar, ... }
const props = defineProps({ player: { type: Object, required: true } })
const emit = defineEmits(['close'])

const dialog = ref(null)
const unlockedIds = ref(null)
const error = ref('')

const avatar = computed(() => avatars.find((item) => item.id === props.player.avatar) ?? null)
// In the same order as on the profile page
const unlocked = computed(() => MEDALS.filter((medal) => unlockedIds.value?.includes(medal.id)))

async function load() {
  error.value = ''
  try {
    unlockedIds.value = (await request(`/leaderboard/players/${props.player.id}/medals`)).unlocked
  } catch {
    error.value = 'Det gick inte att hämta medaljerna. Försök igen.'
  }
}

onMounted(() => {
  dialog.value.showModal()
  load()
})

onBeforeUnmount(() => dialog.value.close())
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="player-medals"
      aria-labelledby="player-medals-title"
      @cancel.prevent="emit('close')"
      @click.self="emit('close')"
    >
      <div class="player-medals__content">
        <button class="player-medals__close" type="button" aria-label="Stäng" @click="emit('close')">
          <span aria-hidden="true">×</span>
        </button>

        <!-- PLAYER -->
        <div class="player-medals__header">
          <span class="player-medals__avatar" :style="avatar && { background: avatar.color }" aria-hidden="true">
            {{ avatar?.emoji ?? player.name[0].toUpperCase() }}
          </span>
          <div>
            <h2 id="player-medals-title">{{ player.name }}</h2>
            <p v-if="unlockedIds">{{ unlocked.length }} / {{ MEDALS.length }} medaljer upplåsta</p>
          </div>
        </div>

        <!-- ERROR / LOADING / EMPTY / MEDALS -->
        <div v-if="error" class="player-medals__message" role="alert">
          <span>{{ error }}</span>
          <button type="button" class="player-medals__retry" @click="load">Försök igen</button>
        </div>

        <p v-else-if="!unlockedIds" class="player-medals__message" role="status">Laddar medaljer…</p>

        <p v-else-if="!unlocked.length" class="player-medals__message">
          {{ player.isMe ? 'Du har' : `${player.name} har` }} inte låst upp några medaljer än.
        </p>

        <ul v-else class="player-medals__grid">
          <li v-for="medal in unlocked" :key="medal.id" class="player-medals__medal" :title="medal.requirement">
            <img :src="medalImage(medal.id)" alt="" />
            <strong>{{ medal.name }}</strong>
            <small>{{ medal.requirement }}</small>
          </li>
        </ul>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.player-medals {
  width: min(560px, calc(100% - 32px));
  max-height: calc(100dvh - 32px);
  margin: auto;
  padding: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-large);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: 0 24px 80px rgb(0 0 0 / 0.25);

  &::backdrop {
    background: var(--color-backdrop);
    backdrop-filter: blur(4px);
  }
}

.player-medals__content {
  position: relative;
  padding: 24px;
}

.player-medals__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: var(--color-surface-soft);
  color: var(--color-text-secondary);
  font-size: 28px;
  cursor: pointer;

  &:hover {
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
  }
}

.player-medals__close:focus-visible,
.player-medals__retry:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}

/* PLAYER */
.player-medals__header {
  margin: 0 48px 20px 0;
  display: flex;
  align-items: center;
  gap: 14px;

  h2 {
    font-size: 22px;
    overflow-wrap: anywhere;
  }

  p {
    margin-top: 2px;
    color: var(--color-accent-dark);
    font-size: 14px;
    font-weight: 700;
  }
}

.player-medals__avatar {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 26px;
  font-weight: 800;
}

/* MESSAGES */
.player-medals__message {
  padding: 28px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  background: var(--color-surface-soft);
  color: var(--color-text-secondary);
  text-align: center;
}

.player-medals__retry {
  padding: 8px 14px;
  border: 0;
  border-radius: var(--radius-small);
  background: var(--color-primary);
  color: white;
  font-weight: 700;
  cursor: pointer;
}

/* MEDALS */
.player-medals__grid {
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  list-style: none;
}

.player-medals__medal {
  padding: 14px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-medium);
  background: var(--color-accent-light);
  text-align: center;

  img {
    width: 64px;
    height: 64px;
    margin-bottom: 6px;
    object-fit: contain;
  }

  strong {
    font-size: 14px;
  }

  small {
    color: var(--color-text-secondary);
    font-size: 12px;
    line-height: 1.3;
  }
}

/* MOBILE */
@media (max-width: 700px) {
  .player-medals__content {
    padding: 20px 16px;
  }

  .player-medals__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
