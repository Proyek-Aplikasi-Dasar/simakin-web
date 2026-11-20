<template>
  <div ref="rootEl" class="relative">
    <label :for="fieldId" class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">{{ label }}</label>

    <button
      :id="fieldId"
      type="button"
      :disabled="disabled"
      aria-haspopup="dialog"
      :aria-expanded="open"
      :aria-invalid="error ? 'true' : undefined"
      :class="[
        'flex h-10 w-full items-center gap-2 rounded-xl border bg-white px-3 text-left text-xs outline-none transition-colors',
        'focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
        open ? 'border-blue-600 ring-2 ring-blue-100' : error ? 'border-red-500' : 'border-slate-200',
      ]"
      @click="toggle"
      @keydown.esc="open = false"
    >
      <span :class="['min-w-0 flex-1 truncate', modelValue ? 'text-slate-900' : 'text-slate-400']">{{ display }}</span>
      <svg class="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    </button>

    <div
      v-if="open"
      role="dialog"
      aria-label="Pilih waktu"
      class="absolute left-0 top-full z-30 mt-1 grid w-full min-w-[260px] grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
      @keydown.esc="open = false"
    >
      <div>
        <p class="py-1.5 text-center text-[11px] font-medium text-slate-500">Jam</p>
        <div class="relative flex max-h-[190px] flex-col gap-0.5 overflow-y-auto" data-list>
          <button
            v-for="j in JAM"
            :key="j"
            type="button"
            :data-selected="j === jam"
            :class="optionClass(j === jam)"
            @click="pilih(j, menit || '00')"
          >
            {{ j }}
          </button>
        </div>
      </div>
      <div>
        <p class="py-1.5 text-center text-[11px] font-medium text-slate-500">Menit</p>
        <div class="relative flex max-h-[190px] flex-col gap-0.5 overflow-y-auto" data-list>
          <button
            v-for="m in MENIT"
            :key="m"
            type="button"
            :data-selected="m === menit"
            :class="optionClass(m === menit)"
            @click="pilih(jam || '00', m)"
          >
            {{ m }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="error" role="alert" class="mt-1 text-xs text-red-600">{{ error }}</p>
    <p v-else-if="note" class="mt-1 text-[11px] leading-[14px] text-slate-500">{{ note }}</p>
    <p v-else-if="hint" class="mt-1 text-[11px] leading-[14px] text-slate-500">{{ hint }}</p>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' }, // 'HH:mm'
  id: { type: String, default: '' },
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  note: { type: String, default: '' },
  error: { type: String, default: '' },
  disabled: Boolean,
})
const emit = defineEmits(['update:modelValue'])

const pad = (n) => String(n).padStart(2, '0')
const JAM = Array.from({ length: 24 }, (_, i) => pad(i))
const MENIT = Array.from({ length: 60 }, (_, i) => pad(i))

const uid = useId()
const fieldId = computed(() => props.id || uid)
const rootEl = ref(null)
const open = ref(false)

const jam = computed(() => (props.modelValue ? props.modelValue.slice(0, 2) : ''))
const menit = computed(() => (props.modelValue ? props.modelValue.slice(3, 5) : ''))
const display = computed(() => (props.modelValue ? `${props.modelValue.slice(0, 5)} WIB` : 'Pilih waktu'))

const optionClass = (selected) => [
  'flex h-9 shrink-0 items-center justify-center rounded-lg text-xs transition-colors',
  selected ? 'bg-blue-50 font-semibold text-blue-600' : 'text-slate-700 hover:bg-slate-50',
]

function pilih(j, m) {
  emit('update:modelValue', `${j}:${m}`)
}

function scrollKePilihan() {
  rootEl.value?.querySelectorAll('[data-list]').forEach((list) => {
    const el = list.querySelector('[data-selected="true"]')
    if (el) list.scrollTop = el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2
  })
}

async function toggle() {
  open.value = !open.value
  if (open.value) {
    await nextTick()
    scrollKePilihan()
  }
}

function onDocDown(e) {
  if (open.value && rootEl.value && !rootEl.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('mousedown', onDocDown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocDown))
</script>
