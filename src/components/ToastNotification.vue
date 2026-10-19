<template>
  <transition name="fade">
    <div
      v-if="toast.visible"
      class="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-full shadow-lg text-white text-sm font-medium z-50"
      :class="toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
    >
      <span>{{ toast.type === 'success' ? '✓' : '✕' }}</span>
      {{ toast.message }}
    </div>
  </transition>
</template>

<script setup>
import { useToastStore } from '../stores/toast'
const toast = useToastStore()
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}
</style>