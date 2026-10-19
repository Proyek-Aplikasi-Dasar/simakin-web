<template>
  <div>
    <div class="px-6 pb-4 pt-6">
      <h2 class="text-base font-semibold text-slate-900">{{ title }}</h2>
      <p class="mt-0.5 text-xs text-slate-500">{{ subtitle }}</p>
    </div>

    <!-- Pencarian -->
    <div class="px-6 pb-5">
      <label class="flex h-11 items-center gap-3 rounded-xl bg-slate-100 px-4 focus-within:ring-2 focus-within:ring-blue-200">
        <AppIcon name="search" class="h-4 w-4 text-slate-400" />
        <input
          v-model="search"
          type="text"
          :placeholder="`Cari ${entity}...`"
          class="w-full bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-400"
        />
      </label>
    </div>

    <p v-if="resource.error" class="mx-6 mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-600">
      {{ resource.error }}
    </p>

    <AdminTable :columns="columns" :rows="filteredRows" :loading="resource.loading" :entity="entity">
      <template #actions="{ row }">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          :aria-label="`Edit ${entity}`"
          @click="router.push(`${basePath}/${row.id}/edit`)"
        >
          <AppIcon name="pencil" class="h-4 w-4" />
        </button>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
          :aria-label="`Hapus ${entity}`"
          @click="rowToDelete = row"
        >
          <AppIcon name="trash" class="h-4 w-4" />
        </button>
      </template>
    </AdminTable>

    <ConfirmDialog
      :show="!!rowToDelete"
      :title="`Hapus ${entity}?`"
      :message="deleteMessage"
      :loading="deleting"
      @cancel="rowToDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'
import AdminTable from './AdminTable.vue'
import ConfirmDialog from './ConfirmDialog.vue'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  entity: { type: String, required: true }, // huruf kecil, contoh: 'jurusan'
  columns: { type: Array, required: true },
  resource: { type: Object, required: true }, // hasil reactive(useMasterResource(...))
  basePath: { type: String, required: true }, // contoh: '/admin/data-master/jurusan'
  deleteMessage: { type: String, default: 'Data yang dihapus tidak bisa dikembalikan.' },
})

const router = useRouter()
const search = ref('')
const rowToDelete = ref(null)
const deleting = ref(false)

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.resource.rows
  return props.resource.rows.filter((row) =>
    props.columns.some((col) => String(row[col.key] ?? '').toLowerCase().includes(q))
  )
})

async function confirmDelete() {
  deleting.value = true
  await props.resource.remove(rowToDelete.value)
  deleting.value = false
  rowToDelete.value = null
}
</script>