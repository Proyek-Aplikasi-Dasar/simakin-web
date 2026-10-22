<template>
  <PeopleListPage
    :breadcrumb="[{ label: 'Pengguna' }, { label: 'Siswa PKL' }]"
    title="Siswa PKL"
    subtitle="Kelola data siswa, penempatan, dan alokasi guru pembimbing."
    add-label="Tambah Siswa"
    add-to="/admin/master-data/siswa/tambah"
    entity="siswa"
    :stats="stats"
    card-title="Daftar Siswa"
    card-subtitle="Seluruh siswa peserta praktik kerja lapangan."
    :tabs="['Semua', 'Aktif PKL', 'Belum Ditempatkan', 'Selesai']"
    search-placeholder="Cari nama / NIS siswa…"
    :filters="['Semua Jurusan', 'Semua Pembimbing']"
    :columns="['Siswa', 'Jurusan', 'Tempat PKL', 'Pembimbing', 'Status']"
  />
</template>

<script setup>
import PeopleListPage from '../../components/PeopleListPage.vue'

const stats = [
  { label: 'Total Siswa PKL', icon: 'cap', tone: 'blue', value: null, hint: '' },
  { label: 'Sudah Ditempatkan', icon: 'pin', tone: 'green', value: null, hint: '' },
  { label: 'Belum Ditempatkan', icon: 'hourglass', tone: 'amber', value: null, hint: '' },
  { label: 'Selesai PKL', icon: 'award', tone: 'blue', value: null, hint: 'nilai akhir diinput' },
]
</script>