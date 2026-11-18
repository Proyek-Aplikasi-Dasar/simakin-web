<template>
  <div>
    <label :for="id" class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">{{ label }}</label>

    <SelectDropdown
      :id="id"
      model-value=""
      :options="available"
      :placeholder="available.length || !options.length ? placeholder : 'Semua sudah dipilih'"
      :disabled="!available.length"
      :error="!!error"
      @update:model-value="add"
    />

    <ul v-if="selectedOptions.length" class="mt-2 flex flex-wrap gap-1.5">
      <li
        v-for="o in selectedOptions"
        :key="o.value"
        class="flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold leading-[14px] text-blue-700"
      >
        {{ o.label }}
        <button
          type="button"
          :aria-label="`Hapus ${o.label}`"
          class="text-blue-700 hover:text-blue-900"
          @click="remove(o.value)"
        >
          <AppIcon name="x" class="h-3 w-3" />
        </button>
      </li>
    </ul>

    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-[11px] text-slate-500">{{ hint }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import SelectDropdown from './SelectDropdown.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  id: { type: String, required: true },
  label: { type: String, required: true },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Pilih' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const selectedOptions = computed(() =>
  props.modelValue.map((v) => props.options.find((o) => o.value === v)).filter(Boolean)
)
const available = computed(() => props.options.filter((o) => !props.modelValue.includes(o.value)))

function add(value) {
  if (value === '' || value == null || props.modelValue.includes(value)) return
  emit('update:modelValue', [...props.modelValue, value])
}

function remove(value) {
  emit('update:modelValue', props.modelValue.filter((v) => v !== value))
}
</script>
