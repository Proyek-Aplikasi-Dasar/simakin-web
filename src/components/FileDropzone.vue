<template>
  <div>
    <div
      :class="[
        'flex flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors',
        dragging ? 'border-blue-600 bg-blue-50' : 'border-blue-400 bg-slate-50',
      ]"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <AppIcon name="file" class="h-5 w-5" />
      </span>
      <p class="mt-2 text-sm font-semibold text-slate-900">Tarik file ke sini atau pilih file</p>
      <p class="text-[11px] text-slate-500">Format .xlsx · maksimal {{ maxMb }} MB</p>

      <button
        type="button"
        class="mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
        @click="picker.click()"
      >
        <AppIcon name="file" class="h-3.5 w-3.5" />
        Pilih File
      </button>
      <input ref="picker" type="file" accept=".xlsx" class="hidden" @change="onPick" />
    </div>

    <p v-if="error" class="mt-2 text-xs text-red-600">{{ error }}</p>

    <div
      v-if="file"
      class="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
    >
      <div class="min-w-0">
        <p class="truncate text-xs font-semibold text-slate-900">{{ file.name }}</p>
        <p class="text-[11px] text-slate-500">{{ sizeLabel }}</p>
      </div>
      <button
        type="button"
        aria-label="Hapus file"
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        @click="clear"
      >
        <AppIcon name="x" class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  maxMb: { type: Number, default: 5 },
})
const emit = defineEmits(['change'])

const picker = ref(null)
const file = ref(null)
const error = ref('')
const dragging = ref(false)

const sizeLabel = computed(() => {
  const bytes = file.value?.size ?? 0
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
})

function accept(candidate) {
  error.value = ''
  if (!candidate) return

  if (!/\.xlsx$/i.test(candidate.name)) {
    error.value = 'Format file harus .xlsx.'
    return
  }
  if (candidate.size > props.maxMb * 1024 * 1024) {
    error.value = `Ukuran file melebihi ${props.maxMb} MB.`
    return
  }

  file.value = candidate
  emit('change', candidate)
}

function onPick(event) {
  accept(event.target.files[0])
  event.target.value = '' 
}

function onDrop(event) {
  dragging.value = false
  accept(event.dataTransfer?.files?.[0])
}

function clear() {
  file.value = null
  error.value = ''
  emit('change', null)
}
</script>