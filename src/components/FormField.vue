<template>
  <div>
    <label :for="id" class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">{{ label }}</label>

    <div class="relative">
      <select
        v-if="options"
        :id="id"
        :value="modelValue"
        :disabled="disabled"
        :class="[base, 'h-10', borderClass]"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option value="" disabled>{{ placeholder || 'Pilih' }}</option>
        <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>

      <textarea
        v-else-if="textarea"
        :id="id"
        :value="modelValue"
        :rows="rows"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="[base, 'py-2.5', borderClass]"
        @input="$emit('update:modelValue', $event.target.value)"
      ></textarea>

      <input
        v-else
        :id="id"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="[base, 'h-10', suffix ? 'pr-14' : '', borderClass]"
        @input="$emit('update:modelValue', $event.target.value)"
      />

      <span v-if="suffix" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
        {{ suffix }}
      </span>
    </div>

    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-[11px] text-slate-500">{{ hint }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  suffix: { type: String, default: '' },
  options: { type: Array, default: null }, 
  textarea: Boolean,
  rows: { type: Number, default: 4 },
  disabled: Boolean,
})
defineEmits(['update:modelValue'])

const base =
  'w-full rounded-xl border bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400'

const borderClass = computed(() => (props.error ? 'border-red-500' : 'border-slate-200'))
</script>