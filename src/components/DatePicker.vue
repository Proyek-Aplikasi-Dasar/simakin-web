<template>
  <div ref="rootEl" class="relative">
    <button
      :id="id"
      ref="triggerEl"
      type="button"
      :disabled="disabled"
      aria-haspopup="dialog"
      :aria-expanded="open"
      :aria-invalid="error ? 'true' : undefined"
      :class="triggerClass"
      @click="toggle"
      @keydown.esc="close(true)"
    >
      <AppIcon v-if="!bare" name="calendar" class="h-4 w-4 shrink-0 text-slate-400" />
      <span :class="['min-w-0 flex-1 truncate text-left', hasValue ? 'text-slate-900' : 'text-slate-400']">
        {{ display }}
      </span>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="panelEl"
        :style="panelStyle"
        role="dialog"
        aria-label="Pilih tanggal"
        class="z-[60] w-[288px] rounded-2xl border border-slate-200 bg-white p-3 shadow-lg"
        @keydown.esc="close(true)"
      >
        <div class="mb-2 flex items-center justify-between gap-1">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Sebelumnya"
            @click="step(-1)"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>

          <button
            type="button"
            class="rounded-lg px-2 py-1 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            @click="zoomOut"
          >
            {{ title }}
          </button>

          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Berikutnya"
            @click="step(1)"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>

        <!-- Hari -->
        <template v-if="view === 'days'">
          <div class="mb-1 grid grid-cols-7 text-center">
            <span v-for="h in HARI" :key="h" class="py-1 text-[11px] font-semibold uppercase text-slate-400">{{ h }}</span>
          </div>
          <div class="grid grid-cols-7 gap-y-0.5">
            <button
              v-for="c in cells"
              :key="c.iso"
              type="button"
              :disabled="c.disabled"
              :aria-label="c.iso"
              :aria-pressed="c.selected"
              :class="[
                'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs transition-colors',
                c.selected
                  ? 'bg-blue-600 font-semibold text-white'
                  : c.disabled
                    ? 'cursor-not-allowed text-slate-300'
                    : c.today
                      ? 'font-semibold text-blue-600 ring-1 ring-blue-200 hover:bg-blue-50'
                      : c.inMonth
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-slate-300 hover:bg-slate-50',
              ]"
              @click="pickDay(c)"
            >
              {{ c.day }}
            </button>
          </div>
        </template>

        <!-- Bulan -->
        <div v-else-if="view === 'months'" class="grid grid-cols-3 gap-2 py-1">
          <button
            v-for="m in monthCells"
            :key="m.index"
            type="button"
            :disabled="m.disabled"
            :class="[
              'h-10 rounded-xl text-xs transition-colors',
              m.selected
                ? 'bg-blue-600 font-semibold text-white'
                : m.disabled
                  ? 'cursor-not-allowed text-slate-300'
                  : m.current
                    ? 'font-semibold text-blue-600 ring-1 ring-blue-200 hover:bg-blue-50'
                    : 'text-slate-700 hover:bg-slate-100',
            ]"
            @click="pickMonth(m)"
          >
            {{ m.label }}
          </button>
        </div>

        <!-- Tahun -->
        <div v-else class="grid grid-cols-3 gap-2 py-1">
          <button
            v-for="y in yearCells"
            :key="y.year"
            type="button"
            :disabled="y.disabled"
            :class="[
              'h-10 rounded-xl text-xs transition-colors',
              y.selected
                ? 'bg-blue-600 font-semibold text-white'
                : y.disabled
                  ? 'cursor-not-allowed text-slate-300'
                  : y.current
                    ? 'font-semibold text-blue-600 ring-1 ring-blue-200 hover:bg-blue-50'
                    : 'text-slate-700 hover:bg-slate-100',
            ]"
            @click="pickYear(y)"
          >
            {{ y.year }}
          </button>
        </div>

        <div class="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
          <button
            v-if="clearable && hasValue"
            type="button"
            class="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
            @click="clear"
          >
            Hapus
          </button>
          <span v-else></span>
          <button
            type="button"
            :disabled="!todayAllowed"
            class="rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
            @click="pickToday"
          >
            {{ mode === 'month' ? 'Bulan ini' : 'Hari ini' }}
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import AppIcon from './AppIcon.vue'

// Kalender bertema pengganti <input type="date"> / <input type="month"> bawaan browser.
// Nilai memakai format yang sama dengan input native: 'YYYY-MM-DD' (mode date) atau 'YYYY-MM' (mode month).
const props = defineProps({
  modelValue: { type: String, default: '' },
  mode: { type: String, default: 'date' }, // 'date' | 'month'
  min: { type: String, default: undefined },
  max: { type: String, default: undefined },
  placeholder: { type: String, default: '' },
  id: { type: String, default: undefined },
  disabled: Boolean,
  error: Boolean,
  clearable: Boolean,
  size: { type: String, default: 'md' }, // 'md' (h-10 text-xs) | 'lg' (h-11 text-sm)
  bare: Boolean, // tanpa kotak & ikon sendiri; dipakai di dalam pembungkus yang sudah bergaya
})
const emit = defineEmits(['update:modelValue', 'blur'])

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

const pad = (n) => String(n).padStart(2, '0')
const isoDate = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const isoMonth = (y, m) => `${y}-${pad(m + 1)}`

function parse(v) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(v || '')
  if (!m) return null
  return { y: Number(m[1]), m: Number(m[2]) - 1, d: m[3] ? Number(m[3]) : 1 }
}

const now = new Date()
const todayParts = { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() }
const todayIso = isoDate(todayParts.y, todayParts.m, todayParts.d)

const rootEl = ref(null)
const triggerEl = ref(null)
const panelEl = ref(null)
const open = ref(false)
const panelStyle = ref({})

const view = ref('days') // 'days' | 'months' | 'years'
const cursorY = ref(todayParts.y)
const cursorM = ref(todayParts.m)
const yearPageStart = ref(todayParts.y - 4)

const value = computed(() => parse(props.modelValue))
const hasValue = computed(() => !!value.value)

const display = computed(() => {
  const v = value.value
  if (!v) return props.placeholder || (props.mode === 'month' ? 'Pilih bulan' : 'Pilih tanggal')
  return props.mode === 'month' ? `${BULAN[v.m]} ${v.y}` : `${v.d} ${BULAN_PENDEK[v.m]} ${v.y}`
})

const triggerClass = computed(() => {
  if (props.bare) {
    return 'flex w-full min-w-0 items-center bg-transparent text-left outline-none disabled:cursor-not-allowed disabled:opacity-60'
  }
  return [
    'flex w-full items-center gap-2 rounded-xl border bg-white px-3 outline-none',
    props.size === 'lg' ? 'h-11 text-sm' : 'h-10 text-xs',
    'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
    props.error ? 'border-red-500' : open.value ? 'border-blue-600' : 'border-slate-200',
    open.value ? 'ring-2 ring-blue-100' : 'focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-100',
  ]
})

// ---------- batas min / max ----------
const minDate = computed(() => (props.min ? props.min.slice(0, props.mode === 'month' ? 7 : 10) : ''))
const maxDate = computed(() => (props.max ? props.max.slice(0, props.mode === 'month' ? 7 : 10) : ''))
const outOfRange = (iso) => (minDate.value && iso < minDate.value) || (maxDate.value && iso > maxDate.value)

const todayAllowed = computed(() =>
  !outOfRange(props.mode === 'month' ? isoMonth(todayParts.y, todayParts.m) : todayIso)
)

// ---------- tampilan ----------
const title = computed(() => {
  if (view.value === 'days') return `${BULAN[cursorM.value]} ${cursorY.value}`
  if (view.value === 'months') return String(cursorY.value)
  return `${yearPageStart.value} – ${yearPageStart.value + 11}`
})

const cells = computed(() => {
  const y = cursorY.value
  const m = cursorM.value
  const first = new Date(y, m, 1)
  const offset = (first.getDay() + 6) % 7 // minggu mulai Senin
  const out = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(y, m, 1 - offset + i)
    const iso = isoDate(d.getFullYear(), d.getMonth(), d.getDate())
    out.push({
      iso,
      day: d.getDate(),
      inMonth: d.getMonth() === m,
      selected: iso === props.modelValue?.slice(0, 10),
      today: iso === todayIso,
      disabled: !!outOfRange(iso),
    })
  }
  return out
})

const monthCells = computed(() =>
  BULAN_PENDEK.map((label, index) => {
    const iso = isoMonth(cursorY.value, index)
    return {
      index,
      label,
      selected: iso === props.modelValue?.slice(0, 7),
      current: cursorY.value === todayParts.y && index === todayParts.m,
      disabled: outOfRangeMonth(cursorY.value, index),
    }
  })
)

// Di mode date, sebuah bulan hanya nonaktif jika seluruh harinya di luar batas
function outOfRangeMonth(y, m) {
  if (props.mode === 'month') return !!outOfRange(isoMonth(y, m))
  const lastDay = new Date(y, m + 1, 0).getDate()
  return !!(
    (minDate.value && isoDate(y, m, lastDay) < minDate.value) ||
    (maxDate.value && isoDate(y, m, 1) > maxDate.value)
  )
}

const yearCells = computed(() =>
  Array.from({ length: 12 }, (_, i) => {
    const year = yearPageStart.value + i
    const minY = minDate.value ? Number(minDate.value.slice(0, 4)) : null
    const maxY = maxDate.value ? Number(maxDate.value.slice(0, 4)) : null
    return {
      year,
      selected: value.value?.y === year,
      current: year === todayParts.y,
      disabled: (minY != null && year < minY) || (maxY != null && year > maxY),
    }
  })
)

function step(dir) {
  if (view.value === 'days') {
    const d = new Date(cursorY.value, cursorM.value + dir, 1)
    cursorY.value = d.getFullYear()
    cursorM.value = d.getMonth()
  } else if (view.value === 'months') {
    cursorY.value += dir
  } else {
    yearPageStart.value += dir * 12
  }
}

function zoomOut() {
  if (view.value === 'days') view.value = 'months'
  else if (view.value === 'months') {
    yearPageStart.value = cursorY.value - 4
    view.value = 'years'
  }
}

function pickYear(y) {
  if (y.disabled) return
  cursorY.value = y.year
  view.value = 'months'
}

function pickMonth(m) {
  if (m.disabled) return
  cursorM.value = m.index
  if (props.mode === 'month') {
    emit('update:modelValue', isoMonth(cursorY.value, m.index))
    close(true)
  } else {
    view.value = 'days'
  }
}

function pickDay(c) {
  if (c.disabled) return
  emit('update:modelValue', c.iso)
  close(true)
}

function pickToday() {
  if (!todayAllowed.value) return
  emit('update:modelValue', props.mode === 'month' ? isoMonth(todayParts.y, todayParts.m) : todayIso)
  close(true)
}

function clear() {
  emit('update:modelValue', '')
  close(true)
}

// ---------- posisi & buka/tutup ----------
function place() {
  const t = triggerEl.value
  if (!t) return
  const r = t.getBoundingClientRect()
  const width = 288
  const height = panelEl.value?.offsetHeight || 360
  const vh = window.innerHeight
  const below = vh - r.bottom - 8
  const above = r.top - 8
  const openUp = below < height && above > below
  const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8))
  panelStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    ...(openUp ? { bottom: `${vh - r.top + 4}px` } : { top: `${r.bottom + 4}px` }),
  }
}

function syncCursor() {
  const v = value.value
  cursorY.value = v ? v.y : todayParts.y
  cursorM.value = v ? v.m : todayParts.m
  yearPageStart.value = cursorY.value - 4
  view.value = props.mode === 'month' ? 'months' : 'days'
}

function onOutside(e) {
  if (rootEl.value?.contains(e.target) || panelEl.value?.contains(e.target)) return
  close()
}

function openPanel() {
  if (props.disabled || open.value) return
  syncCursor()
  open.value = true
  place()
  nextTick(place)
}

function close(refocus = false) {
  if (!open.value) return
  open.value = false
  emit('blur')
  if (refocus) triggerEl.value?.focus()
}

function toggle() {
  open.value ? close() : openPanel()
}

watch(view, () => nextTick(place))

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('mousedown', onOutside)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
  } else {
    document.removeEventListener('mousedown', onOutside)
    window.removeEventListener('resize', place)
    window.removeEventListener('scroll', place, true)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onOutside)
  window.removeEventListener('resize', place)
  window.removeEventListener('scroll', place, true)
})
</script>
