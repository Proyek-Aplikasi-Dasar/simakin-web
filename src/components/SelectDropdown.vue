<template>
  <div ref="rootEl" class="relative">
    <button
      :id="id"
      ref="triggerEl"
      type="button"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-invalid="error ? 'true' : undefined"
      :class="triggerClass"
      @click="toggle"
      @keydown="onKeydown"
    >
      <AppIcon v-if="icon" :name="icon" class="h-4 w-4 shrink-0 text-slate-400" />
      <span :class="['min-w-0 flex-1 truncate text-left', selected ? 'text-slate-900' : 'text-slate-400']">
        {{ selected ? selected.label : placeholder }}
      </span>
      <AppIcon
        v-if="!bare"
        name="chevron-down"
        :class="['h-4 w-4 shrink-0 text-slate-400 transition-transform', open ? 'rotate-180' : '']"
      />
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="panelEl"
        :style="panelStyle"
        class="z-[60] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
      >
        <div v-if="showSearch" class="border-b border-slate-100 p-2">
          <label class="flex h-8 items-center gap-2 rounded-lg bg-slate-100 px-2.5 focus-within:ring-2 focus-within:ring-blue-200">
            <AppIcon name="search" class="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref="searchEl"
              v-model="query"
              type="text"
              placeholder="Cari…"
              class="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400"
              @keydown="onKeydown"
            />
          </label>
        </div>

        <ul ref="listEl" role="listbox" :style="{ maxHeight: `${listMaxHeight}px` }" class="overflow-y-auto py-1">
          <li v-if="!filtered.length" class="px-3 py-2 text-xs text-slate-400">Tidak ada pilihan.</li>
          <li
            v-for="(o, i) in filtered"
            :key="String(o.value)"
            role="option"
            :aria-selected="isSelected(o)"
            :data-index="i"
            :class="[
              'flex cursor-pointer items-center gap-2 px-3 py-2 text-xs',
              isSelected(o) ? 'bg-blue-50 font-semibold text-blue-600' : 'text-slate-700',
              i === activeIndex && !isSelected(o) ? 'bg-slate-100' : '',
            ]"
            @mouseenter="activeIndex = i"
            @mousedown.prevent
            @click="choose(o)"
          >
            <span class="min-w-0 flex-1 truncate">{{ o.label }}</span>
            <svg
              v-if="isSelected(o)"
              class="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] }, // [{ value, label }]
  placeholder: { type: String, default: 'Pilih' },
  icon: { type: String, default: '' }, 
  id: { type: String, default: undefined },
  disabled: Boolean,
  error: Boolean,
  searchable: Boolean, 
  searchThreshold: { type: Number, default: 8 }, 
  size: { type: String, default: 'md' }, 
  bare: Boolean,
})
const emit = defineEmits(['update:modelValue', 'blur'])

const rootEl = ref(null)
const triggerEl = ref(null)
const panelEl = ref(null)
const searchEl = ref(null)
const listEl = ref(null)

const open = ref(false)
const query = ref('')
const activeIndex = ref(0)
const panelStyle = ref({})
const listMaxHeight = ref(256)

const showSearch = computed(() => props.searchable || props.options.length > props.searchThreshold)

const triggerClass = computed(() => {
  if (props.bare) {
    return 'flex h-7 w-full items-center gap-2 bg-transparent px-1 text-xs text-slate-500 outline-none disabled:cursor-not-allowed disabled:opacity-60'
  }
  return [
    'flex w-full items-center gap-2 rounded-xl border bg-white px-3 outline-none',
    props.size === 'lg' ? 'h-11 text-sm' : 'h-10 text-xs',
    'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
    props.error ? 'border-red-500' : open.value ? 'border-blue-600' : 'border-slate-200',
    open.value ? 'ring-2 ring-blue-100' : 'focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-100',
  ]
})

const isSelected = (o) =>
  props.modelValue !== '' && props.modelValue != null
    ? String(o.value) === String(props.modelValue)
    : String(o.value) === ''

const selected = computed(() => {
  const hit = props.options.find(isSelected)
  return hit && !(String(hit.value) === '' && !hit.label) ? hit : null
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? props.options.filter((o) => String(o.label).toLowerCase().includes(q)) : props.options
})

watch(query, () => {
  activeIndex.value = 0
})

function place() {
  const t = triggerEl.value
  if (!t) return
  const r = t.getBoundingClientRect()
  const width = Math.max(r.width, 200)
  const vh = window.innerHeight
  const below = vh - r.bottom - 8
  const above = r.top - 8
  const openUp = below < 220 && above > below
  const space = openUp ? above : below

  listMaxHeight.value = Math.max(120, Math.min(280, space - (showSearch.value ? 56 : 8)))
  const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8))
  panelStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    width: `${width}px`,
    ...(openUp ? { bottom: `${vh - r.top + 4}px` } : { top: `${r.bottom + 4}px` }),
  }
}

function scrollActiveIntoView() {
  listEl.value?.querySelector(`[data-index="${activeIndex.value}"]`)?.scrollIntoView({ block: 'nearest' })
}

function onOutside(e) {
  if (rootEl.value?.contains(e.target) || panelEl.value?.contains(e.target)) return
  close()
}

function openList() {
  if (props.disabled || open.value) return
  query.value = ''
  const idx = props.options.findIndex(isSelected)
  activeIndex.value = idx >= 0 ? idx : 0
  open.value = true
  place()
  nextTick(() => {
    place()
    if (showSearch.value) searchEl.value?.focus()
    scrollActiveIntoView()
  })
}

function close(refocus = false) {
  if (!open.value) return
  open.value = false
  emit('blur')
  if (refocus) triggerEl.value?.focus()
}

function toggle() {
  open.value ? close() : openList()
}

function choose(o) {
  emit('update:modelValue', o.value)
  close(true)
}

function move(step) {
  const n = filtered.value.length
  if (!n) return
  activeIndex.value = (activeIndex.value + step + n) % n
  nextTick(scrollActiveIntoView)
}

function onKeydown(e) {
  if (!open.value) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key) && e.target === triggerEl.value) {
      e.preventDefault()
      openList()
    }
    return
  }

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      move(1)
      break
    case 'ArrowUp':
      e.preventDefault()
      move(-1)
      break
    case 'Home':
      if (!showSearch.value) {
        e.preventDefault()
        activeIndex.value = 0
        nextTick(scrollActiveIntoView)
      }
      break
    case 'End':
      if (!showSearch.value) {
        e.preventDefault()
        activeIndex.value = Math.max(0, filtered.value.length - 1)
        nextTick(scrollActiveIntoView)
      }
      break
    case 'Enter':
      e.preventDefault()
      if (filtered.value[activeIndex.value]) choose(filtered.value[activeIndex.value])
      break
    case ' ':
      if (!showSearch.value) {
        e.preventDefault()
        if (filtered.value[activeIndex.value]) choose(filtered.value[activeIndex.value])
      }
      break
    case 'Escape':
      e.preventDefault()
      close(true)
      break
    case 'Tab':
      close()
      break
  }
}

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
