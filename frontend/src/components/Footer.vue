<script setup>
defineOptions({ name: 'AppFooter' })
</script>

<template>
  <footer class="footer">
    <RouterLink :to="{ name: 'help' }">Hjälp</RouterLink>
    <RouterLink :to="{ name: 'privacy' }">Integritetspolicy</RouterLink>
    <RouterLink :to="{ name: 'terms' }">Användarvillkor</RouterLink>
  </footer>
</template>

<style scoped>
.footer {
  display: flex;
  justify-content: space-evenly;
  gap: 16px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.footer a:hover {
  text-decoration: underline;
}
</style>
