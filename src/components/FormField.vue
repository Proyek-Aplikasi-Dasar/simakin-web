<template>
  <div>
    <label :for="fieldId" class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">
      {{ label }}<span v-if="required" class="text-red-600" aria-hidden="true"> *</span>
    </label>

    <div class="relative">
      <select
        v-if="options"
        :id="fieldId"
        v-bind="a11y"
        :name="name"
        :value="modelValue"
        :disabled="disabled"
        :class="[base, 'h-10', borderClass]"
        @change="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur')"
      >
        <option value="" disabled>{{ placeholder || 'Pilih' }}</option>
        <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>

      <textarea
        v-else-if="textarea"
        :id="fieldId"
        v-bind="a11y"
        :name="name"
        :value="modelValue"
        :rows="rows"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :class="[base, 'py-2.5', borderClass]"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur')"
      ></textarea>

      <input
        v-else
        :id="fieldId"
        v-bind="a11y"
        :name="name"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :maxlength="maxlength"
        :min="min"
        :max="max"
        :step="step"
        :class="[base, 'h-10', suffix ? 'pr-14' : '', borderClass]"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur')"
      />

      <span v-if="suffix" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
        {{ suffix }}
      </span>
    </div>

    <p v-if="error" :id="errorId" role="alert" class="mt-1 text-xs text-red-600">{{ error }}</p>
    <p v-else-if="hint" :id="hintId" class="mt-1 text-[11px] text-slate-500">{{ hint }}</p>
  </div>
</template>

<script setup>
import { computed, useId } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  id: { type: String, default: '' },
  label: { type: String, required: true },
  name: { type: String, default: undefined },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  suffix: { type: String, default: '' },
  options: { type: Array, default: null },
  textarea: Boolean,
  rows: { type: Number, default: 4 },
  disabled: Boolean,
  readonly: Boolean,
  required: Boolean,
  autocomplete: { type: String, default: undefined },
  inputmode: { type: String, default: undefined },
  maxlength: { type: [Number, String], default: undefined },
  min: { type: [Number, String], default: undefined },
  max: { type: [Number, String], default: undefined },
  step: { type: [Number, String], default: undefined },
})
defineEmits(['update:modelValue', 'blur'])

const uid = useId()
const fieldId = computed(() => props.id || uid)
const errorId = computed(() => `${fieldId.value}-error`)
const hintId = computed(() => `${fieldId.value}-hint`)

const a11y = computed(() => ({
  'aria-invalid': props.error ? 'true' : undefined,
  'aria-required': props.required ? 'true' : undefined,
  'aria-describedby': props.error ? errorId.value : props.hint ? hintId.value : undefined,
}))

const base =
  'w-full rounded-xl border bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400'

const borderClass = computed(() => (props.error ? 'border-red-500' : 'border-slate-200'))
</script>