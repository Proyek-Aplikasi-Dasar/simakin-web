<template>
  <BaseModal :show="show" :title="`Import ${title}`" @close="close">
    <div class="flex flex-col gap-4">
      <p class="text-xs leading-5 text-slate-600">
        Isi template terlebih dahulu, lalu unggah file .xlsx. Baris pertama berisi nama kolom.
      </p>

      <button
        v-if="templateType"
        type="button"
        :disabled="downloading"
        class="flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60"
        @click="getTemplate"
      >
        <AppIcon name="download" class="h-4 w-4" />
        {{ downloading ? 'Mengunduh…' : 'Unduh Template' }}
      </button>

      <FileDropzone :key="dropKey" @change="file = $event" />

      <div v-if="result" class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
        <p class="font-semibold text-slate-900">{{ result.message }}</p>
        <p class="mt-1 text-slate-600">Berhasil: {{ result.success }} data · Gagal: {{ result.failed }} data</p>
        <ul v-if="result.errors?.length" class="mt-3 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-red-600">
          <li v-for="(e, i) in result.errors" :key="i">Baris {{ e.row }}: {{ e.error }}</li>
        </ul>
      </div>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50"
          @click="close"
        >
          Tutup
        </button>
        <button
          type="button"
          :disabled="!file || importing"
          class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          @click="start"
        >
          <AppIcon name="file" class="h-4 w-4" />
          {{ importing ? 'Mengimport…' : 'Mulai Import' }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import FileDropzone from './FileDropzone.vue'
import AppIcon from './AppIcon.vue'
import { useToastStore } from '../stores/toast'
import { downloadTemplate, templateErrorMessage, uploadExcel, uploadErrorMessage } from '../utils/bulk'

const props = defineProps({
  show: Boolean,
  title: { type: String, required: true }, 
  endpoint: { type: String, required: true }, 
  templateType: { type: String, default: '' }, 
})
const emit = defineEmits(['close', 'done'])

const toast = useToastStore()
const file = ref(null)
const result = ref(null)
const importing = ref(false)
const downloading = ref(false)
const dropKey = ref(0)

watch(
  () => props.show,
  (open) => {
    if (!open) return
    file.value = null
    result.value = null
    dropKey.value++
  }
)

function close() {
  if (importing.value) return
  emit('close')
}

async function getTemplate() {
  if (downloading.value) return
  downloading.value = true
  try {
    await downloadTemplate(props.templateType)
  } catch (err) {
    toast.show(await templateErrorMessage(err), 'error')
  } finally {
    downloading.value = false
  }
}

async function start() {
  if (!file.value || importing.value) return
  importing.value = true
  result.value = null
  try {
    const data = await uploadExcel(props.endpoint, file.value)
    result.value = data
    toast.show(data.message || 'Import selesai.', data.failed > 0 ? 'error' : 'success')
    if (data.success > 0) emit('done')
    file.value = null
    dropKey.value++
  } catch (err) {
    const message = uploadErrorMessage(err)
    if (message) toast.show(message, 'error')
  } finally {
    importing.value = false
  }
}
</script>