<template>
  <div class="bg-white rounded-lg shadow-sm">
    <div class="p-4 border-b">
      <input v-model="search" type="text" placeholder="Cari..." class="border rounded-lg px-3 py-2 text-sm w-64" />
    </div>
    <table class="w-full text-sm">
      <thead class="bg-gray-50 text-gray-600 text-left">
        <tr>
          <th v-for="col in columns" :key="col.key" @click="sortBy(col.key)" class="px-4 py-3 cursor-pointer select-none">
            {{ col.label }}
            <span v-if="sortKey === col.key">{{ sortAsc ? '↑' : '↓' }}</span>
          </th>
          <th v-if="$slots.actions" class="px-4 py-3">Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in paginatedData" :key="i" class="border-t hover:bg-gray-50">
          <td v-for="col in columns" :key="col.key" class="px-4 py-3">{{ row[col.key] }}</td>
          <td v-if="$slots.actions" class="px-4 py-3">
            <slot name="actions" :row="row" />
          </td>
        </tr>
        <tr v-if="paginatedData.length === 0">
          <td :colspan="columns.length + 1" class="px-4 py-6 text-center text-gray-400">Tidak ada data</td>
        </tr>
      </tbody>
    </table>
    <div class="flex items-center justify-between p-4 border-t text-sm">
      <span>Halaman {{ page }} dari {{ totalPages || 1 }}</span>
      <div class="flex gap-2">
        <button @click="page--" :disabled="page === 1" class="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
        <button @click="page++" :disabled="page === totalPages" class="px-3 py-1 border rounded disabled:opacity-40">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true }, // [{ key: 'name', label: 'Nama' }]
  data: { type: Array, required: true },
  perPage: { type: Number, default: 5 },
})

const search = ref('')
const sortKey = ref('')
const sortAsc = ref(true)
const page = ref(1)

function sortBy(key) {
  if (sortKey.value === key) { sortAsc.value = !sortAsc.value }
  else { sortKey.value = key; sortAsc.value = true }
}

const filtered = computed(() => {
  if (!search.value) return props.data
  const q = search.value.toLowerCase()
  return props.data.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(q)))
})

const sorted = computed(() => {
  if (!sortKey.value) return filtered.value
  return [...filtered.value].sort((a, b) => {
    const res = String(a[sortKey.value]).localeCompare(String(b[sortKey.value]))
    return sortAsc.value ? res : -res
  })
})

const totalPages = computed(() => Math.ceil(sorted.value.length / props.perPage))
const paginatedData = computed(() => {
  const start = (page.value - 1) * props.perPage
  return sorted.value.slice(start, start + props.perPage)
})
</script>