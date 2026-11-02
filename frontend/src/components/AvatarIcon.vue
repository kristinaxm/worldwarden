<script setup>
// Shows an avatar from findAvatar: the emoji, or the GitHub picture.
// fallback is shown when there is no avatar, e.g. the first letter of the name.
defineProps({
  avatar: { type: Object, default: null },
  fallback: { type: String, default: '' },
})
</script>

<template>
  <img v-if="avatar?.imageUrl" class="avatar-icon" :src="avatar.imageUrl" alt="" referrerpolicy="no-referrer" />
  <template v-else>{{ avatar?.emoji ?? fallback }}</template>
</template>

<style scoped>
.avatar-icon {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
</style>
