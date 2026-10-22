<template>
  <div>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-100">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.6px] text-slate-500"
            >
              {{ col.label }}
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
          <template v-else>
            <tr v-for="row in pagedRows" :key="row.id" class="border-t border-slate-100 hover:bg-slate-50">
              <td v-for="col in columns" :key="col.key" :class="['px-6 py-4', col.cellClass]">
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
import { ref, computed, watch } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  columns: { type: Array, required: true }, 
  rows: { type: Array, default: () => [] },
  loading: Boolean,
  perPage: { type: Number, default: 6 },
  entity: { type: String, default: 'data' }, 
})

const page = ref(1)

const colCount = computed(() => props.columns.length + 1)
const totalPages = computed(() => Math.max(1, Math.ceil(props.rows.length / props.perPage)))

const pagedRows = computed(() => {
  const start = (page.value - 1) * props.perPage
  return props.rows.slice(start, start + props.perPage)
})

const summary = computed(() => {
  const total = props.rows.length
  if (total === 0) return `Tidak ada ${props.entity}`
  const start = (page.value - 1) * props.perPage + 1
  const end = Math.min(page.value * props.perPage, total)
  return `Menampilkan ${start}–${end} dari ${total} ${props.entity}`
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

watch(
  () => props.rows.length,
  () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  }
)
</script>