<template>
  <div :class="bare ? '' : 'overflow-hidden rounded-2xl border border-slate-100 bg-white'">
    <AdminTable
      v-model:page="page"
      v-model:search="search"
      :columns="tableColumns"
      :rows="data"
      :per-page="perPage"
      :loading="loading"
      :entity="entity"
      :filters="filters"
      :filter-state="filterState"
      :search-keys="searchKeys"
      :actions-width="actionsWidth"
      :apply-button="applyButton"
      :search-placeholder="searchPlaceholder"
      searchable
    >
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps ?? {}" />
      </template>
    </AdminTable>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AdminTable from './AdminTable.vue'

const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, required: true },
  perPage: { type: Number, default: 5 },
  loading: Boolean,
  entity: { type: String, default: 'data' },
  filters: { type: Array, default: () => [] },
  filterState: { type: Object, default: null },
  searchKeys: { type: Array, default: null },
  actionsWidth: { type: String, default: 'w-[172px]' },
  applyButton: Boolean,
  searchPlaceholder: { type: String, default: 'Cari…' },
  bare: Boolean,
})

const page = defineModel('page', { default: 1 })
const search = defineModel('search', { default: '' })

const tableColumns = computed(() => props.columns.map((c) => ({ sortable: true, ...c })))
</script>
