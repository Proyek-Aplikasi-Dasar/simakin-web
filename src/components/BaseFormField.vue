<template>
  <div class="mb-4">
    <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">{{ label }}</label>
    <input
      :type="type"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="touched = true"
      :placeholder="placeholder"
      class="w-full border rounded-lg px-3 py-2 text-sm"
      :class="displayError ? 'border-red-400' : 'border-gray-300'"
    />
    <p v-if="displayError" class="text-red-500 text-xs mt-1">{{ displayError }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  label: String,
  modelValue: [String, Number],
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
defineEmits(['update:modelValue'])

const touched = ref(false)

const internalError = computed(() => {
  if (props.required && !props.modelValue) return 'Wajib diisi'
  if (props.type === 'email' && props.modelValue) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!re.test(props.modelValue)) return 'Format email tidak valid'
  }
  return ''
})

const displayError = computed(() => props.error || (touched.value ? internalError.value : ''))

function validate() {
  touched.value = true
  return !internalError.value
}

defineExpose({ validate })
</script>