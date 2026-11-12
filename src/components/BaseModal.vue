<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @mousedown.self="onBackdrop"
      >
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          :class="[
            'flex max-h-[90vh] w-full flex-col rounded-xl bg-white shadow-lg outline-none',
            SIZES[size] ?? SIZES.md,
          ]"
          @keydown="onKeydown"
        >
          <header class="flex items-center justify-between gap-4 px-6 pb-4 pt-6">
            <h2 :id="titleId" class="text-lg font-semibold">{{ title }}</h2>
            <button
              type="button"
              aria-label="Tutup"
              class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              @click="emit('close')"
            >
              <AppIcon name="x" class="h-4 w-4" />
            </button>
          </header>

          <div data-modal-body class="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <slot name="footer" />
          </footer>
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
  title: { type: String, default: '' },
  size: { type: String, default: 'md' }, 
  persistent: Boolean, 
})
const emit = defineEmits(['close'])

const SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }
const panel = ref(null)
const titleId = useId()

const { onKeydown, onBackdrop } = useDialog(() => props.show, panel, {
  onClose: () => emit('close'),
  persistent: () => props.persistent,
  initialFocus:
    '[data-autofocus], [data-modal-body] input:not([type="hidden"]), [data-modal-body] select, [data-modal-body] textarea',
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