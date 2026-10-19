<template>
  <MasterDataPage
    title="Guru"
    :columns="columns"
    :fields="fields"
    :data="rows"
    @save="onSave"
    @delete="onDelete"
  />
</template>

<script setup>
import { ref } from 'vue'
import MasterDataPage from '../../components/MasterDataPage.vue'

const rows = ref([])

const columns = [
  { key: 'nama', label: 'Nama' },
  { key: 'nip', label: 'NIP' },
]

const fields = [
  { key: 'nama', label: 'Nama' },
  { key: 'nip', label: 'NIP' },
]

function onSave(payload) {
  console.log('save guru', payload) // TODO: panggil API
}
function onDelete(row) {
  console.log('delete guru', row) // TODO: panggil API
}
</script>