<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Monitoring' }, { label: 'Jurnal Harian' }]"
      title="Jurnal Harian"
      subtitle="Pantau jurnal kegiatan harian siswa bimbingan."
    />

    <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
      <CardHeader title="Daftar Jurnal Harian Siswa" description="Jurnal harian dari aplikasi siswa." />
      <!-- jurnal belum ada di BE -->
      <p class="border-t border-slate-100 px-4 py-12 text-center text-sm text-slate-400 sm:px-6">PAD 2</p>
    </section>
  </div>
</template>

<script setup>
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
</script>
