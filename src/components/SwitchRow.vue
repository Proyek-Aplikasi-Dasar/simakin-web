<template>
  <div class="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
    <div>
      <p class="text-xs font-semibold leading-4 text-slate-900">{{ label }}</p>
      <p class="mt-0.5 text-[11px] leading-[14px] text-slate-500">{{ hint }}</p>
    </div>

    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-label="label"
      :class="['relative h-6 w-11 shrink-0 rounded-full transition-colors', modelValue ? 'bg-blue-600' : 'bg-slate-300']"
      @click="$emit('update:modelValue', !modelValue)"
    >
      <span
        :class="[
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
          modelValue ? 'left-[22px]' : 'left-0.5',
        ]"
      ></span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  label: { type: String, required: true },
  hint: { type: String, default: '' },
})
defineEmits(['update:modelValue'])
</script>