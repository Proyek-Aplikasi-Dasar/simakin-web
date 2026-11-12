<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
        @mousedown.self="onBackdrop"
      >
        <div
          ref="panel"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="descId"
          tabindex="-1"
          class="w-full max-w-[336px] rounded-2xl bg-white p-4 shadow-xl outline-none"
          @keydown="onKeydown"
        >
          <span class="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AppIcon name="trash" class="h-4 w-4" />
          </span>

          <h2 :id="titleId" class="mt-3 text-sm font-semibold text-slate-900">{{ title }}</h2>
          <p :id="descId" class="mt-1 text-xs leading-5 text-slate-600">{{ message }}</p>

          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              data-autofocus
              :disabled="loading"
              class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
              @click="emit('cancel')"
            >
              Batal
            </button>
            <button
              type="button"
              :disabled="loading"
              class="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              @click="emit('confirm')"
            >
              <AppIcon name="trash" class="h-4 w-4" />
              {{ loading ? loadingLabel : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, useId } from 'vue'
import AppIcon from './AppIcon.vue'
import { useDialog } from '../composables/useDialog'

const props = defineProps({
  show: Boolean,
  title: { type: String, default: 'Hapus data?' },
  message: { type: String, default: '' },
  loading: Boolean,
  confirmLabel: { type: String, default: 'Hapus' },
  loadingLabel: { type: String, default: 'Menghapus...' },
})
const emit = defineEmits(['cancel', 'confirm'])

const panel = ref(null)
const titleId = useId()
const descId = useId()

const { onKeydown, onBackdrop } = useDialog(() => props.show, panel, {
  onClose: () => emit('cancel'),
  persistent: () => props.loading, 
  initialFocus: '[data-autofocus]', 
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>