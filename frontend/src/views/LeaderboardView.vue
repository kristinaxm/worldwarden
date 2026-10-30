<script setup>
import { computed, inject, nextTick, ref, watch } from 'vue'
import { request } from '@/api'
import PlayerMedalsDialog from '@/components/PlayerMedalsDialog.vue'
import { useAuth } from '@/composables/useAuth'
import { findAvatar } from '@/composables/useProfile'
import AvatarIcon from '@/components/AvatarIcon.vue'

// Tabs. The id is the board in GET /api/leaderboard/:board
const BOARDS = [
  { id: 'xp', label: 'Total XP' },
  { id: 'beginner', label: 'Nybörjare' },
  { id: 'medium', label: 'Medel' },
  { id: 'advanced', label: 'Avancerad' },
  { id: 'expert', label: 'Expert' },
]
const PLACE_ICONS = { 1: '🏆', 2: '🥈', 3: '🥉' }

const { user } = useAuth()
const openAuth = inject('openAuth')

const board = ref('xp')
const page = ref(1)
// { board, page, pageSize, totalPlayers, totalPages, entries, me } – see the backend README
const data = ref(null)
const loading = ref(false)
const error = ref('')
let version = 0

// Follows the loaded data, not the selected tab, so the old list never shows with the new tab's columns
const shownBoard = computed(() => data.value?.board ?? board.value)
const boardLabel = computed(() => BOARDS.find((item) => item.id === shownBoard.value).label)
const isXp = computed(() => shownBoard.value === 'xp')

async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  try {
    const result = await request(`/leaderboard/${board.value}?page=${page.value}`)
    if (current === version) data.value = result
  } catch {
    if (current === version) error.value = 'Det gick inte att hämta topplistan. Försök igen.'
  } finally {
    if (current === version) loading.value = false
  }
}

// Also reloads when someone logs in or out, so "Du" and "Din placering" are right
watch([board, page, () => user.value?.id], load, { immediate: true })

function selectBoard(id) {
  board.value = id
  page.value = 1
}

//#region Player medals
// The player whose medals are shown in the modal, null when it is closed
const medalsPlayer = ref(null)
let medalsButton = null

function showMedals(entry, event) {
  medalsButton = event.currentTarget
  medalsPlayer.value = entry
}

// Back to the "Visa medaljer" button, so keyboard users keep their place in the list
async function closeMedals() {
  medalsPlayer.value = null
  await nextTick()
  medalsButton?.focus()
}
//#endregion

function avatarFor(entry) {
  return findAvatar(entry.avatar, entry.avatarUrl)
}

// Top 3 get gold, silver and bronze, 4–10 a light green background
function placeClass(place) {
  if (place === 1) return 'player--gold'
  if (place === 2) return 'player--silver'
  if (place === 3) return 'player--bronze'
  if (place <= 10) return 'player--top'
  return ''
}

// E.g. 85 -> "1 min 25 s", 42 -> "42 s"
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes ? `${minutes} min ${seconds} s` : `${seconds} s`
}
</script>

<template>
  <section class="leaderboard">
    <div class="leaderboard__header">
      <h2>Topplistor</h2>
      <p>Jämför dina resultat med andra spelare.</p>
    </div>

    <!-- TABS -->
    <div class="leaderboard__tabs" role="tablist" aria-label="Topplistor">
      <button
        v-for="item in BOARDS"
        :key="item.id"
        type="button"
        role="tab"
        :aria-selected="board === item.id"
        :class="{ 'leaderboard__tab--active': board === item.id }"
        @click="selectBoard(item.id)"
      >
        {{ item.label }}
      </button>
    </div>

    <!-- YOUR PLACE -->
    <div v-if="data?.me" class="leaderboard__me">
      <span>
        Din placering: <strong>#{{ data.me.place }}</strong>
        <template v-if="isXp"> · {{ data.me.totalXp }} XP</template>
        <template v-else> · {{ data.me.score }}/{{ data.me.total }} rätt på {{ formatTime(data.me.durationSeconds) }}</template>
      </span>
      <button v-if="data.me.page !== page" type="button" @click="page = data.me.page">Visa min placering</button>
    </div>
    <div v-else-if="data && user" class="leaderboard__me leaderboard__me--empty">
      Du finns inte med här än. {{ isXp ? 'Spela ett quiz' : `Spela ${boardLabel}-quizet` }} för att komma med på topplistan!
    </div>
    <div v-else-if="data" class="leaderboard__me leaderboard__me--empty">
      <span>Logga in och spela för att komma med på topplistan.</span>
      <button type="button" @click="openAuth('login')">Logga in</button>
    </div>

    <!-- ERROR / EMPTY / LIST -->
    <div v-if="error" class="leaderboard__empty" role="alert">
      <span>{{ error }}</span>
      <button class="leaderboard__retry" type="button" @click="load">Försök igen</button>
    </div>

    <div v-else-if="!data" class="leaderboard__empty" role="status">Laddar topplistan…</div>

    <div v-else-if="!data.entries.length" class="leaderboard__empty">
      <div class="leaderboard__empty-icon">🏆</div>
      <strong>{{ isXp ? 'Ingen har spelat något quiz än' : `Ingen har spelat ${boardLabel} än` }}</strong>
      <span>Bli först på topplistan!</span>
    </div>

    <div v-else class="leaderboard__list" :aria-busy="loading">
      <div class="leaderboard__columns" aria-hidden="true">
        <span>Plats</span>
        <span>Spelare</span>
        <span>{{ isXp ? 'Nivå' : 'Resultat' }}</span>
        <span>{{ isXp ? 'XP' : 'Tid' }}</span>
        <span>Medaljer</span>
      </div>

      <ol>
        <li
          v-for="(entry, index) in data.entries"
          :key="`${data.board}-${data.page}-${index}`"
          class="player"
          :class="[placeClass(entry.place), { 'player--me': entry.isMe }]"
        >
          <span class="player__place" :aria-label="`Plats ${entry.place}`">
            <!-- Top 3 only show their icon, the rest their number -->
            <span v-if="PLACE_ICONS[entry.place]" class="player__icon" aria-hidden="true">{{ PLACE_ICONS[entry.place] }}</span>
            <template v-else>{{ entry.place }}</template>
          </span>

          <span class="player__name">
            <span
              class="player__avatar"
              :style="avatarFor(entry) && { background: avatarFor(entry).color }"
              aria-hidden="true"
            >
              <AvatarIcon :avatar="avatarFor(entry)" :fallback="entry.name[0].toUpperCase()" />
            </span>
            <strong :title="entry.name">{{ entry.name }}</strong>
            <span v-if="entry.isMe" class="player__you">Du</span>
          </span>

          <!-- Its own columns on wider lists, one line that can wrap on phones -->
          <span class="player__stats">
            <template v-if="isXp">
              <span class="player__stat player__stat--first">Nivå {{ entry.level.level }} · {{ entry.level.name }}</span>
              <span class="player__stat player__stat--second player__stat--main">{{ entry.totalXp }} XP</span>
            </template>
            <template v-else>
              <span class="player__stat player__stat--first player__stat--main">{{ entry.score }}/{{ entry.total }}</span>
              <span class="player__stat player__stat--second">⏱ {{ formatTime(entry.durationSeconds) }}</span>
            </template>
          </span>

          <button
            class="player__medals"
            type="button"
            :aria-label="`Visa medaljer för ${entry.name}`"
            @click="showMedals(entry, $event)"
          >
            🏅 Visa medaljer
          </button>
        </li>
      </ol>

      <!-- PAGINATION -->
      <nav v-if="data.totalPages > 1" class="leaderboard__pages" aria-label="Sidor">
        <button type="button" :disabled="page === 1 || loading" @click="page--">‹ Föregående</button>
        <span>Sida {{ page }} av {{ data.totalPages }}</span>
        <button type="button" :disabled="page === data.totalPages || loading" @click="page++">Nästa ›</button>
      </nav>
    </div>

    <!-- PLAYER MEDALS MODAL -->
    <PlayerMedalsDialog v-if="medalsPlayer" :player="medalsPlayer" @close="closeMedals" />
  </section>
</template>

<style scoped>
.leaderboard {
  padding: 22px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-small);
}

/* HEADER */
.leaderboard__header {
  margin-bottom: 18px;

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

/* TABS */
.leaderboard__tabs {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  button {
    padding: 8px 14px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: white;
    color: var(--color-text);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;

    &:hover {
      background: var(--color-primary-light);
      color: var(--color-primary-dark);
    }

    &.leaderboard__tab--active {
      border-color: var(--color-primary);
      background: var(--color-primary);
      color: white;
    }

    &:focus-visible {
      outline: 3px solid var(--color-primary);
      outline-offset: 2px;
    }
  }
}

/* YOUR PLACE */
.leaderboard__me {
  margin-bottom: 16px;
  padding: 12px 14px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-small);
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 14px;

  &.leaderboard__me--empty {
    border-color: var(--color-border);
    background: var(--color-surface-soft);
    color: var(--color-text-secondary);
  }

  button {
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

/* EMPTY / ERROR / LOADING */
.leaderboard__empty {
  padding: 36px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  background: var(--color-surface-soft);
  color: var(--color-text-secondary);
  text-align: center;

  strong {
    color: var(--color-text);
    font-size: 15px;
  }
}

.leaderboard__empty-icon {
  font-size: 40px;
}

.leaderboard__retry {
  padding: 10px 16px;
  border: 0;
  border-radius: var(--radius-small);
  background: var(--color-primary);
  color: white;
  font-weight: 700;
  cursor: pointer;
}

/* LIST */
.leaderboard__list {
  /* The rows change layout from the list's own width, see the container queries at the bottom */
  container: leaderboard / inline-size;
  transition: opacity 0.2s ease;

  &[aria-busy='true'] {
    opacity: 0.6;
  }

  ol {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    list-style: none;
  }
}

/* Same columns for the header row and every player */
.leaderboard__columns,
.player {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 160px 110px 150px;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
}

.leaderboard__columns {
  margin-bottom: 6px;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;

  span:first-child {
    text-align: center;
  }

  span:nth-child(3) {
    text-align: center;
  }

  span:nth-child(4) {
    text-align: right;
  }

  span:nth-child(5) {
    text-align: center;
  }
}

/* PLAYER */
.player {
  min-height: 58px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  background: white;

  &.player--top {
    border-color: #cfe9d6;
    background: #f1faf3;
  }

  &.player--gold {
    border-color: #e9cf7f;
    background: linear-gradient(90deg, #fff3cf, #fffaeb);
  }

  &.player--silver {
    border-color: #cfd6dc;
    background: linear-gradient(90deg, #eef1f4, #f8fafb);
  }

  &.player--bronze {
    border-color: #e5c1a3;
    background: linear-gradient(90deg, #fbe9db, #fdf6f0);
  }

  &.player--me {
    outline: 2px solid var(--color-primary);
    outline-offset: -1px;
  }
}

/* Centered, so the icons and the numbers line up in one column */
.player__place {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 800;
}

.player__icon {
  font-size: 26px;
}

.player__name {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.player__avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 18px;
  font-weight: 800;
}

.player__you {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-primary);
  color: white;
  font-size: 11px;
  font-weight: 700;
}

/* The stats are grid items of the row themselves, except on phones (see the bottom) */
.player__stats {
  display: contents;
}

.player__stat {
  color: var(--color-text-secondary);
  font-size: 14px;
  text-align: right;
  white-space: nowrap;

  &.player__stat--main {
    color: var(--color-text);
    font-size: 16px;
    font-weight: 800;
  }

  /* Centered, so texts of different length (e.g. "Nivå 4 · Expert", "Nivå 3 · Avancerad") line up */
  &.player__stat--first {
    text-align: center;
  }
}

.player__medals {
  justify-self: center;
  padding: 6px 12px;
  border: 1px solid var(--color-accent);
  border-radius: 999px;
  background: var(--color-accent-light);
  color: var(--color-accent-dark);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--color-accent);
  }

  &:focus-visible {
    outline: 3px solid var(--color-primary);
    outline-offset: 2px;
  }
}

/* PAGINATION */
.leaderboard__pages {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--color-text-secondary);
  font-size: 14px;

  button {
    padding: 8px 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    background: white;
    color: var(--color-primary);
    font-weight: 700;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: var(--color-primary-light);
    }

    &:disabled {
      color: var(--color-text-secondary);
      opacity: 0.5;
      cursor: default;
    }
  }
}

/* SMALL SCREENS */
@media (max-width: 700px) {
  .leaderboard {
    padding: 18px;
  }

  .leaderboard__pages {
    gap: 8px;

    button {
      padding: 8px 10px;
    }
  }
}

/* NARROW LIST – the width of the list, not the screen, decides the layout,
   since the sidebar takes a different amount of space on desktop, tablet and mobile */
@container leaderboard (max-width: 819px) {
  .leaderboard__columns {
    display: none;
  }

  /* Name in the middle, the stats stacked to the right of it, the medals button last */
  .player {
    grid-template-columns: 52px minmax(0, 1fr) auto auto;
    grid-template-areas:
      'place name first medals'
      'place name second medals';
    row-gap: 2px;
    padding: 10px 14px;

    .player__place {
      grid-area: place;
    }

    .player__name {
      grid-area: name;
    }

    .player__stat {
      text-align: right;
      font-size: 13px;

      &.player__stat--first {
        grid-area: first;
        text-align: right;
      }

      &.player__stat--second {
        grid-area: second;
      }

      &.player__stat--main {
        font-size: 15px;
      }
    }

    .player__medals {
      grid-area: medals;
      margin-left: 6px;
    }
  }
}

/* PHONE-SIZED LIST – place and name on the first row, the stats under the name, the medals button last */
@container leaderboard (max-width: 479px) {
  .player {
    grid-template-columns: 40px minmax(0, 1fr);
    grid-template-areas:
      'place name'
      'place stats'
      'place medals';
    column-gap: 8px;
    padding: 10px 12px;

    /* One line under the name, lined up with the avatar. The second stat moves to its own
       line as a whole when there is no room, instead of breaking in the middle of the text. */
    .player__stats {
      grid-area: stats;
      margin-top: 4px;
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 2px 12px;
    }

    .player__stat {
      text-align: left;

      &.player__stat--first {
        text-align: left;
      }

      &.player__stat--main {
        font-size: 14px;
      }
    }

    .player__medals {
      justify-self: start;
      margin-top: 8px;
      padding: 4px 10px;
      font-size: 12px;
    }
  }

  .player__icon {
    font-size: 22px;
  }
}
</style>
