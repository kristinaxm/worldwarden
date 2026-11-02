<script setup>
defineProps({
  title: { type: String, required: true },
  intro: { type: String, default: '' },
  updated: { type: String, default: '' },
})
</script>

<template>
  <article class="info-page">
    <header class="info-page__header">
      <h2>{{ title }}</h2>
      <p v-if="intro">{{ intro }}</p>
      <small v-if="updated">Senast uppdaterad {{ updated }}</small>
    </header>

    <div class="info-page__content">
      <slot />
    </div>
  </article>
</template>

<style scoped>
.info-page {
  padding: 22px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-small);
}

/* HEADER */
.info-page__header {
  margin-bottom: 8px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--color-border);

  h2 {
    margin-bottom: 6px;
    font-size: 24px;
  }

  p {
    margin: 0;
    color: var(--color-primary);
    font-size: 16px;
    font-weight: 700;
  }

  small {
    margin-top: 6px;
    display: block;
    color: var(--color-text-secondary);
  }
}

.info-page__content {
  max-width: 75ch;
  line-height: 1.6;

  :deep(h3) {
    margin: 24px 0 8px;
    font-size: 18px;
  }

  :deep(p),
  :deep(ul) {
    margin: 0 0 12px;
  }

  :deep(ul) {
    padding-left: 22px;
  }

  :deep(li + li) {
    margin-top: 4px;
  }

  :deep(a) {
    color: var(--color-primary);
    font-weight: 700;
    text-decoration: underline;

    &:hover {
      color: var(--color-primary-dark);
    }
  }
}

@media (max-width: 700px) {
  .info-page {
    padding: 18px;
  }
}
</style>
