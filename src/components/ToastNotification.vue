<template>
  <section
    class="pointer-events-none fixed left-1/2 top-4 z-[60] w-full max-w-[400px] -translate-x-1/2 px-4 sm:top-6"
    aria-label="Notifikasi"
  >
    <TransitionGroup name="toast" tag="div" class="relative flex flex-col gap-3">
      <div
        v-for="t in toast.items"
        :key="t.id"
        :role="t.type === 'error' ? 'alert' : 'status'"
        class="pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_12px_32px_-8px_rgba(15,23,42,0.22)]"
      >
        <div class="flex items-start gap-3 p-4 pr-3">
          <span :class="['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', styleOf(t).bubble]">
            <AppIcon :name="styleOf(t).icon" class="h-5 w-5" />
          </span>

          <div class="min-w-0 flex-1 pt-0.5">
            <p class="text-sm font-semibold leading-5 text-slate-900">{{ styleOf(t).title }}</p>
            <p class="mt-0.5 break-words text-[13px] leading-5 text-slate-600">{{ t.message }}</p>
          </div>

          <button
            type="button"
            aria-label="Tutup notifikasi"
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            @click="toast.dismiss(t.id)"
          >
            <AppIcon name="x" class="h-4 w-4" />
          </button>
        </div>

        <!-- progress bar waktu tampil; key=stamp supaya animasinya mulai ulang kalau toast yang sama muncul lagi -->
        <div v-if="t.duration > 0" class="h-1 w-full bg-slate-100">
          <div
            :key="t.stamp"
            :class="['toast-progress h-full', styleOf(t).bar]"
            :style="{ animationDuration: t.duration + 'ms' }"
          />
        </div>
      </div>
    </TransitionGroup>
  </section>
</template>

<script setup>
import { useToastStore } from '../stores/toast'
import AppIcon from './AppIcon.vue'

const toast = useToastStore()

// Kelas ditulis utuh (bukan disusun dari string) supaya tidak dibuang Tailwind saat build
const STYLES = {
  success: { title: 'Berhasil', icon: 'circle-check', bubble: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500' },
  error: { title: 'Gagal', icon: 'circle-x', bubble: 'bg-red-50 text-red-600', bar: 'bg-red-500' },
  warning: { title: 'Perhatian', icon: 'alert', bubble: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500' },
  info: { title: 'Informasi', icon: 'bell', bubble: 'bg-blue-50 text-blue-600', bar: 'bg-blue-500' },
}
const styleOf = (t) => STYLES[t.type] ?? STYLES.info
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.toast-leave-active {
  position: absolute;
  width: 100%;
}
.toast-move {
  transition: transform 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}

.toast-progress {
  width: 100%;
  transform-origin: left;
  animation-name: toast-shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
@keyframes toast-shrink {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition: opacity 0.15s;
  }
  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }
  .toast-progress {
    animation: none;
  }
}
</style>
