<script setup>
import { computed } from 'vue'
import flagsImage from '@/assets/images/quizhero/flaggor.png'
import capitalsImage from '@/assets/images/quizhero/huvudstäder.png'
import countriesImage from '@/assets/images/quizhero/länder.png'
import continentsImage from '@/assets/images/quizhero/världsdelar.png'
import seasLakesImage from '@/assets/images/quizhero/havochsjöar.png'
import LoginRequired from '@/components/LoginRequired.vue'
import { useAuth } from '@/composables/useAuth'
import { useResults } from '@/composables/useResults'

const categoryImages = {
  Flaggor: flagsImage,
  Huvudstäder: capitalsImage,
  Länder: countriesImage,
  Världsdelar: continentsImage,
  'Hav & Sjöar': seasLakesImage,
}

const { user, pending } = useAuth()
const { results } = useResults()

// Senast spelade quiz först
const sortedResults = computed(() =>
  [...results.value].sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt)),
)

function formatDate(value) {
  return new Date(value).toLocaleString('sv-SE', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<template>
  <div class="results-page">
    <LoginRequired
      v-if="pending || !user"
      title="Mina resultat"
      tagline="Se hur det gick – fråga för fråga."
      message="Logga in för att se dina resultat"
    />

    <!-- RESULTS -->
    <section v-else class="results-card">
      <div class="results-header">
        <h2>Mina resultat</h2>
        <p class="results-header__tagline">Se hur det gick – fråga för fråga.</p>
      </div>

      <!-- NO RESULTS -->
      <div v-if="!sortedResults.length" class="results-empty">
        <div class="results-empty__icon">🌍</div>
        <strong>Du har inte spelat något quiz än</strong>
        <span>Välj ett quiz på startsidan och kom tillbaka hit.</span>
      </div>

      <!-- RESULTS -->
      <div v-else class="results">
        <details v-for="result in sortedResults" :key="result.id" class="result">
          <!-- CLOSED: QUIZ, DATE AND SCORE -->
          <summary class="result__summary">
            <div class="result__image" :style="{ backgroundImage: `url(${categoryImages[result.category]})` }"></div>

            <div class="result__info">
              <h3>{{ result.category }}</h3>
              <div class="result__meta">
                <span class="result__badge">{{ result.difficulty }}</span>
                <time :datetime="result.playedAt">📅 {{ formatDate(result.playedAt) }}</time>
              </div>
            </div>

            <div class="result__score">
              <strong>{{ result.score }}<small>/{{ result.totalQuestions }}</small></strong>
              <div class="result__bar">
                <div :style="{ width: `${result.percentage}%` }"></div>
              </div>
              <span>{{ result.percentage }}% rätt</span>
            </div>

            <span class="result__toggle" aria-hidden="true">›</span>
          </summary>

          <!-- OPEN: SAME INFO AS WHEN THE QUIZ WAS FINISHED -->
          <div class="result__details">
            <div class="result__stats">
              <div class="result__stat">
                <span>✅ Rätt</span>
                <strong class="result__correct">{{ result.score }}</strong>
              </div>
              <div class="result__stat">
                <span>❌ Fel</span>
                <strong class="result__wrong">{{ result.wrong }}</strong>
              </div>
              <div class="result__stat">
                <span>🔥 Bästa streak</span>
                <strong>{{ result.bestStreak }}</strong>
              </div>
              <div class="result__stat">
                <span>⏱ Tid</span>
                <strong>{{ result.time }}</strong>
              </div>
            </div>

            <ol class="result__questions">
              <li
                v-for="(question, index) in result.questions"
                :key="index"
                class="result__question"
                :class="{ 'result__question--wrong': question.answer !== question.correctAnswer }"
              >
                <span class="result__number">{{ index + 1 }}</span>
                <img v-if="question.image" class="result__flag" :src="question.image" alt="" />
                <span v-else class="result__subject">{{ question.subject }} →</span>
                <span class="result__answer">
                  <strong>{{ question.correctAnswer }}</strong>
                  <small v-if="question.answer !== question.correctAnswer">Ditt svar: {{ question.answer }}</small>
                </span>
                <span class="result__icon">{{ question.answer === question.correctAnswer ? '✓' : '×' }}</span>
              </li>
            </ol>
          </div>
        </details>
      </div>
    </section>
  </div>
</template>

<style scoped>
.results-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.results-card {
  padding: 22px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-small);
}

/* PAGE HEADER */
.results-header {
  margin-bottom: 20px;

  h2 {
    margin-bottom: 6px;
    font-size: 24px;
  }

  .results-header__tagline {
    color: var(--color-primary);
    font-size: 16px;
    font-weight: 700;
  }
}

/* EMPTY */
.results-empty {
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

  .results-empty__icon {
    font-size: 40px;
  }

  strong {
    color: var(--color-text);
    font-size: 15px;
  }

  span {
    font-size: 13px;
  }
}

/* RESULT LIST */
.results {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.result {
  overflow: hidden;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.1);
  }

  &[open] {
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.1);

    .result__toggle {
      transform: rotate(90deg);
      background: var(--color-primary);
      color: white;
    }
  }
}

/* CLOSED */
.result__summary {
  display: flex;
  align-items: stretch;
  list-style: none;
  cursor: pointer;

  &::-webkit-details-marker {
    display: none;
  }

  &:focus-visible {
    outline: 3px solid var(--color-primary);
    outline-offset: -3px;
    border-radius: 10px;
  }
}

.result__image {
  width: 180px;
  min-height: 110px;
  flex-shrink: 0;
  background-size: cover;
  background-position: center;
}

.result__info {
  flex: 1;
  min-width: 0;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;

  h3 {
    font-size: 18px;
  }
}

.result__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.result__badge {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 12px;
  font-weight: 700;
}

.result__score {
  width: 150px;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;

  strong {
    color: var(--color-primary-dark);
    font-size: 26px;
    line-height: 1;

    small {
      color: var(--color-text-secondary);
      font-size: 15px;
    }
  }

  span {
    color: var(--color-text-secondary);
    font-size: 12px;
  }
}

.result__bar {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-border);

  div {
    height: 100%;
    border-radius: inherit;
    background: var(--color-primary);
  }
}

.result__toggle {
  width: 32px;
  height: 32px;
  margin: auto 18px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 20px;
  font-weight: 700;
  transition: transform 0.2s ease, background 0.15s ease, color 0.15s ease;
}

/* OPEN */
.result__details {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-soft);
}

.result__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.result__stat {
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;

  span {
    color: var(--color-text-secondary);
    font-size: 12px;
  }

  strong {
    font-size: 18px;
  }
}

.result__correct {
  color: #1e7a3c;
}

.result__wrong {
  color: #b42318;
}

.result__questions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  list-style: none;
}

.result__question {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;

  &.result__question--wrong {
    background: #fdf3f2;
    border-color: #f3c7c3;
  }
}

.result__number {
  width: 18px;
  color: var(--color-text-secondary);
  font-size: 12px;
  text-align: right;
}

.result__flag {
  width: 32px;
  height: 22px;
  border-radius: 3px;
  object-fit: cover;
  box-shadow: 0 0 0 1px var(--color-border);
}

.result__subject {
  color: var(--color-text-secondary);
}

.result__answer {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;

  small {
    color: #b42318;
    font-size: 12px;
  }
}

.result__icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #e3f4e8;
  color: #1e7a3c;
  font-size: 13px;
  font-weight: 700;
}

.result__question--wrong .result__icon {
  background: #fbe2e0;
  color: #b42318;
}

/* MEDIA QUERIES */
/* TABLET */
@media (max-width: 1024px) {
  .result__questions {
    grid-template-columns: 1fr;
  }
}

/* MOBILE */
@media (max-width: 700px) {
  .results-card {
    padding: 18px;
  }

  .result__summary {
    flex-wrap: wrap;
  }

  .result__image {
    width: 100%;
    min-height: 120px;
  }

  .result__info {
    padding: 14px 14px 0;
  }

  .result__score {
    flex: 1;
    padding: 12px 14px 14px;
  }

  .result__toggle {
    margin: auto 14px;
  }

  .result__info {
    flex-basis: 100%;
  }

  .result__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
