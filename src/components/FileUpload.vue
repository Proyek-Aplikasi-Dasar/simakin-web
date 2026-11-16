<template>
  <FileUploader accept=".xlsx,.xls,.csv" :max-mb="5" :label="label" @change="onChange" />
</template>

<script setup>
import FileUploader from './FileUploader.vue'

defineProps({ label: { type: String, default: 'Upload File' } })
const emit = defineEmits(['file-selected'])

// null = file dihapus; tetap diteruskan agar parent ikut mengosongkan state-nya
function onChange(file) {
  emit('file-selected', file)
}
</script>