<template>
  <div class="flex flex-col gap-2">
    <p :id="`${id}-label`" class="text-xs font-semibold leading-4 text-slate-600">{{ label }}</p>
    <div role="radiogroup" :aria-labelledby="`${id}-label`" class="flex flex-wrap gap-6">
      <label
        v-for="o in options"
        :key="o.value"
        :class="[
          'flex items-center gap-2.5 rounded-xl px-4 py-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-300',
          modelValue === o.value
            ? 'border-[1.5px] border-blue-600 bg-blue-50'
            : 'border border-slate-200 bg-white',
          isDisabled(o) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        ]"
      >
        <input
          type="radio"
          :name="id"
          :value="o.value"
          :checked="modelValue === o.value"
          :disabled="isDisabled(o)"
          class="sr-only"
          @change="$emit('update:modelValue', o.value)"
        />
        <span
          :class="[
            'h-[18px] w-[18px] shrink-0 rounded-full bg-white',
            modelValue === o.value ? 'border-[5px] border-blue-600' : 'border-[1.5px] border-slate-300',
          ]"
        ></span>
        <span :class="['text-sm font-semibold', modelValue === o.value ? 'text-blue-600' : 'text-slate-600']">
          {{ o.label }}
        </span>
      </label>
    </div>
    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="text-[11px] text-slate-500">{{ hint }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  id: { type: String, required: true },
  label: { type: String, required: true },
  options: { type: Array, default: () => [] }, // [{ value, label, disabled? }]
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  disabled: Boolean,
})

defineEmits(['update:modelValue'])

const isDisabled = (o) => props.disabled || !!o.disabled
</script>