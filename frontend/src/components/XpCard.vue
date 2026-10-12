<script setup>
import { onMounted } from 'vue'
import { useXp } from '@/composables/useXp'

const {
  totalXp,
  currentLevel,
  nextLevel,
  xpInLevel,
  xpForLevel,
  xpToNextLevel,
  progress,
  loadXp,
} = useXp()

// Hämta XP när komponenten laddas
onMounted(loadXp)
</script>

<template>
  <div class="xp-card">
    <div class="xp-card__header">
      <div>
        <p class="xp-card__label">Din nivå</p>
        <h3 class="xp-card__level">
          {{ currentLevel.level }} · {{ currentLevel.name }}
        </h3>
      </div>
      <div class="xp-card__total">
        <p class="xp-card__label">Total XP</p>
        <p class="xp-card__amount">{{ totalXp }} XP</p>
      </div>
    </div>

    <!-- Progressbar -->
    <div class="xp-card__progress">
      <div class="xp-card__progress-bar">
        <div class="xp-card__progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <span class="xp-card__progress-percent">{{ progress }}%</span>
    </div>

    <!-- Text under bar -->
    <p class="xp-card__progress-text">
      <template v-if="nextLevel">
        {{ totalXp }} XP
        <span class="xp-card__progress-next">
          · {{ xpToNextLevel }} XP kvar till {{ nextLevel.name }}
        </span>
      </template>
      <template v-else>
        🏆 Du har nått högsta nivån!
      </template>
    </p>
  </div>
</template>

<style scoped>
.xp-card {
  padding: 20px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-small);
}


.xp-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}

.xp-card__label {
  color: var(--color-text-secondary);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.xp-card__level {
  margin-top: 4px;
  font-size: 22px;
  font-weight: 800;
  color: var(--color-primary);
}

.xp-card__total {
  text-align: right;
}

.xp-card__amount {
  margin-top: 4px;
  font-size: 22px;
  font-weight: 800;
  color: #92400e;
}

.xp-card__progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.xp-card__progress-bar {
  flex: 1;
  height: 14px;
  background: var(--color-surface-soft);
  border-radius: 999px;
  overflow: hidden;
}

.xp-card__progress-percent {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
  min-width: 40px;
  text-align: right;
}

.xp-card__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  border-radius: 999px;
  transition: width 0.5s ease;
}

.xp-card__progress-text {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.xp-card__progress-next {
  color: var(--color-primary);
  font-weight: 700;
}

@media (max-width: 500px) {
  .xp-card__header {
    flex-direction: column;
    align-items: flex-start;
  }
  .xp-card__total {
    text-align: left;
  }
}
</style>