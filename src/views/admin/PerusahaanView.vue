<template>
  <MasterDataPage
    title="Perusahaan / Industri"
    :columns="columns"
    :fields="fields"
    :data="rows"
    allow-bulk
    @save="onSave"
    @delete="onDelete"
    @bulk-upload="onBulkUpload"
  />
</template>

<script setup>
import { ref } from 'vue'
import MasterDataPage from '../../components/MasterDataPage.vue'

const rows = ref([])

const columns = [
  { key: 'nama', label: 'Nama' },
  { key: 'alamat', label: 'Alamat' },
  { key: 'pimpinan', label: 'Pimpinan' },
]

const fields = [
  { key: 'nama', label: 'Nama' },
  { key: 'alamat', label: 'Alamat' },
  { key: 'latitude', label: 'Latitude', type: 'number' },
  { key: 'longitude', label: 'Longitude', type: 'number' },
  { key: 'pimpinan', label: 'Pimpinan' },
  { key: 'deskripsi', label: 'Deskripsi', type: 'textarea' },
]

function onSave(payload) {
  console.log('save perusahaan', payload) // TODO: panggil API
}
function onDelete(row) {
  console.log('delete perusahaan', row) // TODO: panggil API
}
function onBulkUpload(file) {
  console.log('bulk upload perusahaan', file) // TODO: panggil API
}
</script>