<template>
  <FormField
    :model-value="modelValue"
    :label="label"
    :type="type"
    :placeholder="placeholder"
    :required="required"
    :error="displayError"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="touched = true"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import FormField from './FormField.vue'
import { required as requiredRule, email as emailRule } from '../utils/validators'

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
  if (props.required) {
    const msg = requiredRule()(props.modelValue)
    if (msg) return msg
  }
  return props.type === 'email' ? emailRule()(props.modelValue) : ''
})

const displayError = computed(() => props.error || (touched.value ? internalError.value : ''))

function validate() {
  touched.value = true
  return !internalError.value
}

defineExpose({ validate })
</script>