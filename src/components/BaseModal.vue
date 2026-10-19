<template>
  <div v-if="show" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-semibold text-lg">{{ title }}</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({ show: Boolean, title: { type: String, default: '' } })
defineEmits(['close'])
</script>