<template>
  <PeopleListPage
    :breadcrumb="[{ label: 'Pengguna' }, { label: 'Guru Pembimbing' }]"
    title="Guru Pembimbing"
    subtitle="Kelola data guru pembimbing dan pembagian siswa bimbingan."
    add-label="Tambah Guru"
    add-to="/admin/master-data/guru/tambah"
    entity="guru"
    :stats="stats"
    card-title="Daftar Guru Pembimbing"
    card-subtitle="Guru pembimbing PKL beserta beban bimbingannya."
    search-placeholder="Cari nama atau NIP…"
    :filters="['Semua Jurusan', 'Semua Status']"
    :columns="['Guru', 'Jurusan', 'Beban Bimbingan', 'Perusahaan', 'Status']"
  />
</template>

<script setup>
import PeopleListPage from '../../components/PeopleListPage.vue'

const stats = [
  { label: 'Total Guru', icon: 'user-check', tone: 'blue', value: null, hint: 'guru pembimbing terdaftar' },
  { label: 'Aktif Membimbing', icon: 'user-check', tone: 'green', value: null, hint: '' },
  { label: 'Rata-rata Bimbingan', icon: 'users', tone: 'blue', value: null, hint: 'siswa per guru' },
  { label: 'Belum Ada Siswa', icon: 'alert', tone: 'amber', value: null, hint: 'perlu dialokasikan' },
]
</script>