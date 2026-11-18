<template>
  <div>
    <div
      v-if="searchable || filters.length || $slots.toolbar"
      class="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6"
    >
      <form class="contents" @submit.prevent="apply">
        <label
          v-if="searchable"
          class="flex h-10 w-full min-w-0 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-100 px-3 focus-within:ring-2 focus-within:ring-blue-200 sm:min-w-[240px] sm:flex-1"
        >
          <AppIcon name="search" class="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref="searchEl"
            v-model="draftSearch"
            type="text"
            :placeholder="searchPlaceholder"
            :aria-label="searchPlaceholder"
            class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <span class="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium leading-[14px] text-slate-500 md:block">Ctrl K</span>
        </label>

        <SelectDropdown
          v-for="f in filterDefs"
          :key="f.key"
          v-model="draftFilters[f.key]"
          class="w-full sm:w-[200px]"
          :icon="f.icon"
          :placeholder="`Semua ${f.label}`"
          :searchable="f.searchable"
          :options="[{ value: '', label: `Semua ${f.label}` }, ...f.options.map((o) => ({ value: String(o.value), label: o.label }))]"
        />

        <button
          v-if="applyButton"
          type="submit"
          class="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-600 hover:bg-blue-100 sm:w-auto"
        >
          <AppIcon name="filter" class="h-5 w-5" />
          Terapkan
        </button>
      </form>

      <div v-if="$slots.toolbar" class="flex flex-wrap items-center gap-2 sm:ml-auto">
        <slot name="toolbar" />
      </div>
    </div>

    <div class="overflow-x-auto">
      <!-- hp: baris jadi kartu (label dari data-label), sm ke atas: tabel biasa -->
      <table
        class="w-full table-fixed text-left text-sm max-sm:block sm:min-w-[var(--tbl-min)]"
        :style="{ '--tbl-min': `${minTableWidth}px` }"
      >
        <thead class="border-t border-slate-100 bg-slate-100 max-sm:hidden">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :aria-sort="ariaSort(col)"
              :class="[CELL, 'py-2.5 text-[10px] font-semibold uppercase tracking-[0.6px] text-slate-500', col.width]"
            >
              <button
                v-if="col.sortable"
                type="button"
                class="group inline-flex items-center gap-1 uppercase tracking-[0.6px] hover:text-slate-700"
                @click="toggleSort(col.key)"
              >
                {{ col.label }}
                <span
                  aria-hidden="true"
                  :class="sortKey === col.key ? 'text-blue-600' : 'opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60'"
                >{{ sortIcon(col.key) }}</span>
              </button>
              <template v-else>{{ col.label }}</template>
            </th>
            <th
              v-if="$slots.actions"
              :class="[CELL, 'py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.6px] text-slate-500', actionsWidth]"
            >
              Aksi
            </th>
          </tr>
        </thead>

        <tbody class="max-sm:block">
          <template v-if="loading">
            <tr v-for="n in 5" :key="`skeleton-${n}`" class="border-t border-slate-100 max-sm:block max-sm:px-4 max-sm:py-3" aria-hidden="true">
              <td v-for="col in columns" :key="col.key" :class="[CELL, 'py-5 max-sm:block max-sm:!px-0 max-sm:!py-1.5 max-sm:[&:nth-child(n+3)]:hidden']">
                <span class="block h-3 w-28 max-w-full animate-pulse rounded bg-slate-200"></span>
              </td>
              <td v-if="$slots.actions" :class="[CELL, 'py-3 max-sm:block max-sm:!px-0']">
                <span class="ml-auto block h-10 w-24 animate-pulse rounded-xl bg-slate-100"></span>
              </td>
            </tr>
          </template>
          <tr v-else-if="rows.length === 0" class="max-sm:block">
            <td :colspan="colCount" class="px-6 py-12 text-center text-sm text-slate-400 max-sm:block">Tidak ada data</td>
          </tr>
          <tr v-else-if="processedRows.length === 0" class="max-sm:block">
            <td :colspan="colCount" class="px-6 py-12 text-center text-sm text-slate-400 max-sm:block">Tidak ada data yang cocok</td>
          </tr>
          <template v-else>
            <tr v-for="(row, i) in pagedRows" :key="row.id ?? i" class="border-t border-slate-100 max-sm:block max-sm:border-t-8 max-sm:px-4 max-sm:py-2 max-sm:first:border-t-0">
              <td
                v-for="col in columns"
                :key="col.key"
                :data-label="col.label"
                :class="[
                  CELL,
                  'py-3 align-middle text-xs leading-[18px] text-slate-600',
                  'max-sm:flex max-sm:flex-col max-sm:items-start max-sm:gap-1 max-sm:!px-0 max-sm:!py-2.5',
                  'max-sm:[&:nth-child(n+2)]:border-t max-sm:[&:nth-child(n+2)]:border-slate-200',
                  'max-sm:before:shrink-0 max-sm:before:whitespace-nowrap max-sm:before:text-[10px] max-sm:before:font-semibold max-sm:before:uppercase max-sm:before:tracking-[0.6px] max-sm:before:text-slate-500 max-sm:before:content-[attr(data-label)]',
                  'max-sm:first:!pb-3 max-sm:first:before:hidden',
                  col.cellClass,
                ]"
              >
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                  <span
                    v-if="col.badge"
                    :class="[
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4',
                      col.badge(row[col.key]),
                    ]"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                    {{ row[col.key] }}
                  </span>
                  <template v-else>{{ row[col.key] }}</template>
                </slot>
              </td>
              <td v-if="$slots.actions" :class="[CELL, 'py-3 align-middle max-sm:block max-sm:border-t max-sm:border-slate-200 max-sm:!px-0 max-sm:!pb-1 max-sm:!pt-3']">
                <div class="flex justify-end gap-2.5">
                  <slot name="actions" :row="row" />
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div v-if="loading" class="flex items-center border-t border-slate-100 px-4 py-5 sm:px-6">
      <span class="h-3 w-40 animate-pulse rounded bg-slate-200"></span>
    </div>
    <DataPagination
      v-else
      class="print:hidden"
      v-model:page="page"
      :last-page="totalPages"
      :total="processedRows.length"
      :from="from"
      :to="to"
      :item-label="entity"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref, useSlots, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import SelectDropdown from './SelectDropdown.vue'
import DataPagination from './DataPagination.vue'
import { sortRows } from '../utils/sort'
import { useSearchShortcut } from '../composables/useSearchShortcut'

const CELL = 'px-2 first:pl-4 last:pr-4 sm:first:pl-6 sm:last:pr-6'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  loading: Boolean,
  perPage: { type: Number, default: 6 },
  entity: { type: String, default: 'data' },
  searchable: Boolean,
  searchPlaceholder: { type: String, default: 'Cari…' },
  filters: { type: Array, default: () => [] },
  // true = search & filter baru jalan pas klik Terapkan
  applyButton: Boolean,
  // field yg dicari search (default semua kolom), berguna buat field yg ga jadi kolom kayak NIP
  searchKeys: { type: Array, default: null },
  // lebar kolom aksi (kelas tailwind, termasuk padding)
  actionsWidth: { type: String, default: 'w-[172px]' },
  // reactive object dari halaman buat nyimpen filter, biar bisa dipulihin (mis. useListState)
  filterState: { type: Object, default: null },
})

const page = defineModel('page', { default: 1 })

// min width tabel = total kolom fix + 240px buat kolom fleksibel
const slots = useSlots()
const fixedPx = (cls) => Number(/w-\[(\d+)px\]/.exec(cls ?? '')?.[1] ?? 0)
const minTableWidth = computed(
  () =>
    props.columns.reduce((n, c) => n + fixedPx(c.width), 0) + (slots.actions ? fixedPx(props.actionsWidth) : 0) + 240
)

const search = defineModel('search', { default: '' })
const searchEl = ref(null)
useSearchShortcut(searchEl)
const sortKey = ref('')
const sortDir = ref('asc')
const filterValues = props.filterState ?? reactive({})

const draftSearch = ref(search.value)
const draftFilters = reactive({ ...filterValues })

function apply() {
  search.value = draftSearch.value.trim()
  props.filters.forEach((f) => {
    filterValues[f.key] = draftFilters[f.key] ?? ''
  })
}

if (!props.applyButton) {
  watch(draftSearch, apply)
  watch(draftFilters, apply, { deep: true })
}

watch(search, (v) => {
  draftSearch.value = v
})

const colCount = computed(() => props.columns.length + 1)

const filterDefs = computed(() =>
  props.filters.map((f) => ({
    ...f,
    options:
      f.options ??
      [...new Set(props.rows.map((r) => r[f.key]).filter((v) => v !== null && v !== undefined && v !== ''))]
        .sort((a, b) => String(a).localeCompare(String(b), 'id'))
        .map((v) => ({ value: v, label: String(v) })),
  }))
)

function toggleSort(key) {
  if (sortKey.value !== key) {
    sortKey.value = key
    sortDir.value = 'asc'
  } else if (sortDir.value === 'asc') {
    sortDir.value = 'desc'
  } else {
    sortKey.value = ''
    sortDir.value = 'asc'
  }
}

const sortIcon = (key) => (sortKey.value !== key ? '↕' : sortDir.value === 'asc' ? '↑' : '↓')
const ariaSort = (col) =>
  !col.sortable ? undefined : sortKey.value !== col.key ? 'none' : sortDir.value === 'asc' ? 'ascending' : 'descending'

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return props.rows.filter((row) => {
    for (const f of props.filters) {
      const v = filterValues[f.key]
      if (v && !(f.match ? f.match(row, v) : String(row[f.key]) === v)) return false
    }
    if (!q) return true
    const keys = props.searchKeys ?? props.columns.map((c) => c.key)
    return keys.some((k) => String(row[k] ?? '').toLowerCase().includes(q))
  })
})

const processedRows = computed(() => {
  if (!sortKey.value) return filteredRows.value
  const col = props.columns.find((c) => c.key === sortKey.value)
  const getValue = col?.sortValue ?? ((row) => row[sortKey.value])
  return sortRows(filteredRows.value, getValue, sortDir.value)
})

const totalPages = computed(() => Math.max(1, Math.ceil(processedRows.value.length / props.perPage)))

const pagedRows = computed(() => {
  const start = (page.value - 1) * props.perPage
  return processedRows.value.slice(start, start + props.perPage)
})

const from = computed(() => (processedRows.value.length ? (page.value - 1) * props.perPage + 1 : 0))
const to = computed(() => Math.min(page.value * props.perPage, processedRows.value.length))

// reset ke hal 1 kalo search/filter/sort berubah
watch([search, sortKey, sortDir, filterValues], () => (page.value = 1), { deep: true })

// jaga page tetep valid pas data berkurang
watch(
  () => processedRows.value.length,
  () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  }
)
</script>
