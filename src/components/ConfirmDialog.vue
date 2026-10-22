<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
    @click.self="$emit('cancel')"
  >
    <div class="w-full max-w-[336px] rounded-2xl bg-white p-4 shadow-xl" role="alertdialog" aria-modal="true">
      <span class="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AppIcon name="trash" class="h-4 w-4" />
      </span>

      <h2 class="mt-3 text-sm font-semibold text-slate-900">{{ title }}</h2>
      <p class="mt-1 text-xs leading-5 text-slate-600">{{ message }}</p>

      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          :disabled="loading"
          class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
          @click="$emit('cancel')"
        >
          Batal
        </button>
        <button
          type="button"
          :disabled="loading"
          class="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          @click="$emit('confirm')"
        >
          <AppIcon name="trash" class="h-4 w-4" />
          {{ loading ? 'Menghapus...' : 'Hapus' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  show: Boolean,
  title: { type: String, default: 'Hapus data?' },
  message: { type: String, default: '' },
  loading: Boolean,
})
defineEmits(['cancel', 'confirm'])
</script>