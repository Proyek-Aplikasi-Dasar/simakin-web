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
          :role="done ? 'dialog' : 'alertdialog'"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="descId"
          tabindex="-1"
          class="w-full max-w-[440px] rounded-[20px] bg-white p-6 shadow-xl outline-none"
          @keydown="onKeydown"
        >
          <span :class="['flex h-12 w-12 items-center justify-center rounded-full', style.badge]">
            <AppIcon :name="done ? 'circle-check' : icon" class="h-6 w-6" />
          </span>

          <h2 :id="titleId" class="mt-4 text-base font-semibold leading-6 text-slate-900">
            {{ done ? doneTitle : title }}
          </h2>
          <p :id="descId" class="mt-1 text-sm leading-5 text-slate-600">{{ done ? doneMessage : message }}</p>

          <div class="mt-6 flex justify-end gap-3">
            <template v-if="done">
              <button
                type="button"
                data-autofocus
                class="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                @click="emit('close')"
              >
                {{ doneLabel }}
              </button>
            </template>
            <template v-else>
              <button
                type="button"
                data-autofocus
                :disabled="loading"
                class="flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
                @click="emit('cancel')"
              >
                Batal
              </button>
              <button
                type="button"
                :disabled="loading"
                :class="['flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-60', style.button]"
                @click="emit('confirm')"
              >
                <AppIcon :name="icon" class="h-5 w-5" />
                {{ loading ? loadingLabel : confirmLabel }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, useId } from 'vue'
import AppIcon from './AppIcon.vue'
import { useDialog } from '../composables/useDialog'

const props = defineProps({
  show: Boolean,
  title: { type: String, default: 'Hapus data?' },
  message: { type: String, default: '' },
  loading: Boolean,
  confirmLabel: { type: String, default: 'Hapus' },
  loadingLabel: { type: String, default: 'Menghapus...' },
  icon: { type: String, default: 'trash' },
  variant: { type: String, default: 'danger' }, // danger | warning | primary
  // Tampilan "berhasil" setelah aksi selesai (dialog tetap terbuka sampai ditutup)
  done: Boolean,
  doneTitle: { type: String, default: 'Data berhasil dihapus' },
  doneMessage: { type: String, default: 'Perubahan sudah disimpan dan daftar diperbarui.' },
  doneLabel: { type: String, default: 'Selesai' },
})
const emit = defineEmits(['cancel', 'confirm', 'close'])

const VARIANTS = {
  danger: { badge: 'bg-red-50 text-red-600', button: 'bg-red-600 hover:bg-red-700' },
  warning: { badge: 'bg-amber-50 text-amber-600', button: 'bg-amber-600 hover:bg-amber-700' },
  primary: { badge: 'bg-blue-50 text-blue-600', button: 'bg-blue-600 hover:bg-blue-700' },
}
const DONE_STYLE = { badge: 'bg-emerald-50 text-emerald-700' }
const style = computed(() => (props.done ? DONE_STYLE : (VARIANTS[props.variant] ?? VARIANTS.danger)))

const panel = ref(null)
const titleId = useId()
const descId = useId()

const { onKeydown, onBackdrop } = useDialog(() => props.show, panel, {
  onClose: () => emit(props.done ? 'close' : 'cancel'),
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
