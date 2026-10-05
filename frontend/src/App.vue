<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

// Restore the login here so it works on every page,
// including pages outside MainLayout (e.g. QuizView).
const { restore } = useAuth()

onMounted(restore)
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
