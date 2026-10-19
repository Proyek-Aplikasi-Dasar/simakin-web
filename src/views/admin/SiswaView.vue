<template>
  <MasterDataPage
    title="Siswa"
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
  { key: 'nis', label: 'NIS' },
  { key: 'jurusan_id', label: 'Jurusan' },
  { key: 'gelombang_id', label: 'Gelombang' },
  { key: 'kelas', label: 'Kelas' },
  { key: 'telp', label: 'Telp' },
]

const kelasOptions = ['A', 'B', 'C', 'D', 'E'].map((k) => ({ value: k, label: k }))

const fields = [
  { key: 'nama', label: 'Nama' },
  { key: 'nis', label: 'NIS' },
  { key: 'jurusan_id', label: 'Jurusan', options: [] },        // TODO: isi dari data jurusan
  { key: 'gelombang_id', label: 'Gelombang', options: [] },    // TODO: isi dari data gelombang
  { key: 'jenis_kelamin', label: 'Jenis Kelamin', options: [] }, 
  { key: 'kelas', label: 'Kelas', options: kelasOptions },
  { key: 'telp', label: 'Telp' },
  { key: 'ortu', label: 'Nama Orang Tua' },
  { key: 'ortu_telp', label: 'Telp Orang Tua' },
]

function onSave(payload) {
  console.log('save siswa', payload) // TODO: panggil API
}
function onDelete(row) {
  console.log('delete siswa', row) // TODO: panggil API
}
function onBulkUpload(file) {
  console.log('bulk upload siswa', file) // TODO: panggil API
}
</script>