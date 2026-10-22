<template>
  <div>
    <label :for="id" class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">{{ label }}</label>

    <div
      :class="[
        'relative flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border bg-white py-1.5 pl-2 pr-9 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100',
        error ? 'border-red-500' : 'border-slate-200',
      ]"
    >
      <span
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
      </span>

      <select
        :id="id"
        class="min-w-[140px] flex-1 appearance-none bg-transparent px-1 py-1 text-xs text-slate-500 outline-none"
        @change="add"
      >
        <option value="" selected disabled>{{ available.length ? placeholder : 'Semua sudah dipilih' }}</option>
        <option v-for="o in available" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>

      <AppIcon name="chevron-down" class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>

    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-[11px] text-slate-500">{{ hint }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

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

function add(event) {
  const picked = props.options.find((o) => String(o.value) === event.target.value)
  if (picked) emit('update:modelValue', [...props.modelValue, picked.value])
  event.target.value = '' 
}

function remove(value) {
  emit('update:modelValue', props.modelValue.filter((v) => v !== value))
}
</script>