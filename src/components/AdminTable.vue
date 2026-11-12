<template>
  <div>
    <div
      v-if="searchable || filters.length || $slots.toolbar"
      class="flex flex-wrap items-center gap-3 border-b border-slate-100 px-6 py-4"
    >
      <input
        v-if="searchable"
        v-model="search"
        type="search"
        :placeholder="searchPlaceholder"
        :aria-label="searchPlaceholder"
        class="h-9 w-64 max-w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
      />

      <select
        v-for="f in filterDefs"
        :key="f.key"
        v-model="filterValues[f.key]"
        :aria-label="`Filter ${f.label}`"
        class="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
      >
        <option value="">Semua {{ f.label }}</option>
        <option v-for="o in f.options" :key="o.value" :value="String(o.value)">{{ o.label }}</option>
      </select>

      <button
        v-if="isFiltering"
        type="button"
        class="text-xs font-semibold text-blue-600 hover:underline"
        @click="resetFilters"
      >
        Reset
      </button>

      <div v-if="$slots.toolbar" class="ml-auto flex items-center gap-2">
        <slot name="toolbar" />
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-100">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :aria-sort="ariaSort(col)"
              class="px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.6px] text-slate-500"
            >
              <button
                v-if="col.sortable"
                type="button"
                class="inline-flex items-center gap-1 uppercase tracking-[0.6px] hover:text-slate-700"
                @click="toggleSort(col.key)"
              >
                {{ col.label }}
                <span aria-hidden="true">{{ sortIcon(col.key) }}</span>
              </button>
              <template v-else>{{ col.label }}</template>
            </th>
            <th
              v-if="$slots.actions"
              class="px-6 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.6px] text-slate-500"
            >
              Aksi
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td :colspan="colCount" class="px-6 py-12 text-center text-slate-400">Memuat data...</td>
          </tr>
          <tr v-else-if="rows.length === 0">
            <td :colspan="colCount" class="px-6 py-12 text-center text-slate-400">Tidak ada data</td>
          </tr>
          <tr v-else-if="processedRows.length === 0">
            <td :colspan="colCount" class="px-6 py-12 text-center text-slate-400">Tidak ada data yang cocok</td>
          </tr>
          <template v-else>
            <tr v-for="(row, i) in pagedRows" :key="row.id ?? i" class="border-t border-slate-100 hover:bg-slate-50">
              <td v-for="col in columns" :key="col.key" :class="['px-6 py-4', col.cellClass]">
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                  <span
                    v-if="col.badge"
                    :class="[
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-[14px]',
                      col.badge(row[col.key]),
                    ]"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                    {{ row[col.key] }}
                  </span>
                  <template v-else>{{ row[col.key] }}</template>
                </slot>
              </td>
              <td v-if="$slots.actions" class="px-6 py-3">
                <div class="flex justify-end gap-2">
                  <slot name="actions" :row="row" />
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-xs text-slate-600">
      <span>{{ summary }}</span>

      <div v-if="totalPages > 1" class="flex items-center gap-1.5">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"
          :disabled="page === 1"
          aria-label="Halaman sebelumnya"
          @click="page--"
        >
          <AppIcon name="chevron-left" class="h-4 w-4" />
        </button>

        <template v-for="(p, i) in pageNumbers" :key="i">
          <span v-if="p === '…'" class="flex h-8 w-8 items-center justify-center">…</span>
          <button
            v-else
            type="button"
            :aria-current="p === page ? 'page' : undefined"
            :class="[
              'h-8 min-w-8 rounded-lg px-2 text-xs font-semibold',
              p === page ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
            ]"
            @click="page = p"
          >
            {{ p }}
          </button>
        </template>

        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"
          :disabled="page === totalPages"
          aria-label="Halaman berikutnya"
          @click="page++"
        >
          <AppIcon name="chevron-right" class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { sortRows } from '../utils/sort'

// columns: [{ key, label, sortable?, sortValue?(row), badge?(value), cellClass? }]
// filters: [{ key, label, options?: [{ value, label }] }]  (options kosong = diambil dari data)
// Slot: #cell-<key>="{ row, value }", #actions="{ row }", #toolbar
const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  loading: Boolean,
  perPage: { type: Number, default: 6 },
  entity: { type: String, default: 'data' },
  searchable: Boolean,
  searchPlaceholder: { type: String, default: 'Cari...' },
  filters: { type: Array, default: () => [] },
})

const page = defineModel('page', { default: 1 })

const search = ref('')
const sortKey = ref('')
const sortDir = ref('asc')
const filterValues = reactive({})

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

const isFiltering = computed(
  () => search.value.trim() !== '' || props.filters.some((f) => filterValues[f.key])
)

function resetFilters() {
  search.value = ''
  props.filters.forEach((f) => (filterValues[f.key] = ''))
}

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
      if (v && String(row[f.key]) !== v) return false
    }
    if (!q) return true
    return props.columns.some((c) => String(row[c.key] ?? '').toLowerCase().includes(q))
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

const summary = computed(() => {
  const total = processedRows.value.length
  if (total === 0) return `Tidak ada ${props.entity}`
  const start = (page.value - 1) * props.perPage + 1
  const end = Math.min(page.value * props.perPage, total)
  const of = isFiltering.value ? `${total} ${props.entity} (dari ${props.rows.length})` : `${total} ${props.entity}`
  return `Menampilkan ${start}–${end} dari ${of}`
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)

  const wanted = [1, total, page.value - 1, page.value, page.value + 1]
  const list = [...new Set(wanted)].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)

  const result = []
  list.forEach((n, i) => {
    if (i > 0 && n - list[i - 1] > 1) result.push('…')
    result.push(n)
  })
  return result
})

// Kembali ke halaman 1 kalau pencarian, filter, atau urutan berubah
watch([search, sortKey, sortDir, filterValues], () => (page.value = 1), { deep: true })

// Jaga halaman tetap valid kalau jumlah data berkurang
watch(
  () => processedRows.value.length,
  () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  }
)
</script>
