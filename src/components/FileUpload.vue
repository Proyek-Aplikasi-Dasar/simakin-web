<template>
  <div>
    <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">{{ label }}</label>
    <div class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50" @click="$refs.fileInput.click()">
      <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="handleFile" />
      <p v-if="!fileName" class="text-gray-400 text-sm">Klik untuk pilih file Excel (.xlsx, .csv)</p>
      <p v-else class="text-primary text-sm font-medium">{{ fileName }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({ label: { type: String, default: 'Upload File' } })
const emit = defineEmits(['file-selected'])
const fileName = ref('')

function handleFile(e) {
  const file = e.target.files[0]
  if (file) {
    fileName.value = file.name
    emit('file-selected', file)
  }
}
</script>