<template>
  <FileUploader accept=".xlsx" :max-mb="maxMb" @change="$emit('change', $event)" />
</template>

<script setup>
import FileUploader from './FileUploader.vue'

defineProps({
  maxMb: { type: Number, default: 5 },
})
defineEmits(['change'])
</script>