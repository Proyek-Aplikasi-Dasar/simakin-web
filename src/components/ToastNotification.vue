<template>
  <section
    class="pointer-events-none fixed inset-x-0 top-6 z-[60] flex flex-col items-center gap-2 px-4"
    aria-label="Notifikasi"
  >
    <TransitionGroup name="toast">
      <div
        v-for="t in toast.items"
        :key="t.id"
        :role="t.type === 'error' ? 'alert' : 'status'"
        :class="[
          'pointer-events-auto flex max-w-md items-center gap-3 rounded-full py-3 pl-5 pr-3 text-sm font-medium text-white shadow-lg',
          STYLES[t.type] ?? STYLES.info,
        ]"
      >
        <span aria-hidden="true">{{ ICONS[t.type] ?? ICONS.info }}</span>
        <span class="flex-1">{{ t.message }}</span>
        <button
          type="button"
          aria-label="Tutup notifikasi"
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          @click="toast.dismiss(t.id)"
        >
          <AppIcon name="x" class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </section>
</template>

<script setup>
import { useToastStore } from '../stores/toast'
import AppIcon from './AppIcon.vue'

const toast = useToastStore()

const STYLES = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-amber-500',
  info: 'bg-blue-600',
}
const ICONS = { success: '✓', error: '✕', warning: '!', info: 'i' }
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>