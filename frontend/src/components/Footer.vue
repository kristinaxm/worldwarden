<template>
  <footer class="footer">
    <a href="#">Help</a>
    <a href="#">Privacy</a>
    <a href="#">Terms</a>
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
