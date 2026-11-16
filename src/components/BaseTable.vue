<template>
  <div class="overflow-hidden rounded-lg bg-white shadow-sm">
    <AdminTable :columns="tableColumns" :rows="data" :per-page="perPage" searchable>
      <!-- Teruskan semua slot (actions, cell-<key>, toolbar) ke AdminTable -->
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps ?? {}" />
      </template>
    </AdminTable>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AdminTable from './AdminTable.vue'

// Wrapper tipis di atas AdminTable supaya logika sorting/filter/pagination
// hanya ada di satu tempat. Semua kolom bisa diurutkan kecuali sortable: false.
const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, required: true },
  perPage: { type: Number, default: 5 },
})

const tableColumns = computed(() => props.columns.map((c) => ({ sortable: true, ...c })))
</script>
