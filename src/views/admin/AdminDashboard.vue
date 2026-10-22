<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Utama' }, { label: 'Dashboard' }]"
      :title="`Selamat ${waktu}, ${auth.user?.name ?? ''}`"
      subtitle="Ringkasan data global dan aktivitas sistem SimakIn hari ini."
    >

    <button
        type="button"
        disabled
        title="Segera hadir"
        class="flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold leading-5 opacity-50"
      >
        <AppIcon name="download" class="h-5 w-5" />
        Unduh Laporan
      </button>
      <button
        type="button"
        disabled
        title="Segera hadir"
        class="flex cursor-not-allowed items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold leading-5 text-white opacity-50"
      >
        <AppIcon name="circle-check" class="h-5 w-5" />
        Verifikasi Pengajuan
      </button>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section
        class="relative flex items-center justify-between gap-6 overflow-hidden rounded-3xl bg-blue-600 px-8 py-6 text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.35)]"
      >
        <div class="absolute -top-[120px] left-[820px] h-[260px] w-[260px] rounded-full bg-blue-700"></div>
        <div class="absolute left-[960px] top-[40px] h-[180px] w-[180px] rounded-full bg-blue-700"></div>
        <div class="absolute left-[60px] top-[70px] h-[120px] w-[120px] rounded-full bg-blue-700"></div>

        <div class="relative flex flex-col gap-2">
          <h2 class="text-xl font-semibold leading-[30px] tracking-[-0.02em]">Pengajuan PKL menunggu verifikasi</h2>
          <p class="text-xs leading-[18px] text-blue-200">
            Verifikasi pengajuan siswa agar penempatan dan guru pembimbing bisa segera ditetapkan.
          </p>

          <div class="flex items-center gap-3">
            <div class="h-2 w-80 overflow-hidden rounded-full bg-white"></div>
            <span class="text-[11px] font-medium leading-[14px]">Data penempatan belum tersedia</span>
          </div>
        </div>

        <button
          type="button"
          disabled
          title="Segera hadir"
          class="relative flex shrink-0 cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold leading-5 text-slate-900 opacity-70"
        >
          <AppIcon name="arrow-right" class="h-5 w-5" />
          Lihat Pengajuan
        </button>
      </section>

      <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" />
      </section>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_352px]">
        <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <CardHeader
            title="Pengajuan PKL Terbaru"
            description="Pengajuan tempat PKL dari aplikasi siswa."
            action="Lihat semua"
          />
          <div class="flex items-center gap-4 border-t border-slate-100 bg-slate-100 px-6 py-2.5">
            <span class="flex-1 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Siswa</span>
            <span class="w-[170px] text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Perusahaan</span>
            <span class="w-[101px] text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Status</span>
            <span class="w-10"></span>
          </div>
          <p class="px-6 py-12 text-center text-sm text-slate-400">
            Data pengajuan belum tersedia.
          </p>
        </section>

        <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <CardHeader title="Akses Cepat" description="Pintasan tugas admin." />
          <div class="grid grid-cols-2 gap-3 px-6 pb-8 pt-1">
            <template v-for="item in shortcuts" :key="item.label">
              <component
                :is="item.to ? 'router-link' : 'span'"
                :to="item.to"
                :title="item.to ? undefined : 'Segera hadir'"
                :class="[
                  'flex flex-col items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-100 p-4 text-xs font-semibold leading-4 text-slate-900',
                  item.to ? 'hover:bg-slate-200' : 'cursor-not-allowed opacity-60',
                ]"
              >
                <span :class="['flex h-10 w-10 items-center justify-center rounded-lg', tones[item.tone]]">
                  <AppIcon :name="item.icon" class="h-5 w-5" />
                </span>
                {{ item.label }}
              </component>
            </template>
          </div>
        </section>
      </div>

      <!-- Baris 2 -->
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_352px]">
        <section class="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <CardHeader
            title="Kehadiran per Jurusan"
            description="Persentase kehadiran minggu ini."
            action="Rekap lengkap"
          />
          <p class="flex-1 px-6 py-12 text-center text-sm text-slate-400">
            Data kehadiran belum tersedia. 
          </p>
          <div class="flex gap-4 px-8 py-4">
            <span class="flex items-center gap-2 text-[11px] font-medium leading-[14px] text-slate-600">
              <span class="h-2 w-2 rounded-full bg-blue-600"></span>
              ≥ 90% sesuai target
            </span>
            <span class="flex items-center gap-2 text-[11px] font-medium leading-[14px] text-slate-600">
              <span class="h-2 w-2 rounded-full bg-yellow-700"></span>
              &lt; 90% perlu perhatian
            </span>
          </div>
        </section>

        <section class="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <CardHeader title="Aktivitas Sistem" action="Lihat semua" />
          <p class="flex-1 px-6 py-12 text-center text-sm text-slate-400">
            Belum ada aktivitas.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'

const auth = useAuthStore()

// Sapaan mengikuti jam di perangkat pengguna
const waktu = computed(() => {
  const jam = new Date().getHours()
  if (jam < 11) return 'pagi'
  if (jam < 15) return 'siang'
  if (jam < 18) return 'sore'
  return 'malam'
})

const stats = [
  { label: 'Total Siswa PKL', icon: 'users', tone: 'blue', value: null, hint: 'aktif di sistem' },
  { label: 'Guru Pembimbing', icon: 'user-check', tone: 'blue', value: null, hint: '' },
  { label: 'Perusahaan Mitra', icon: 'building', tone: 'amber', value: null, hint: '' },
  { label: 'Kehadiran Hari Ini', icon: 'calendar-check', tone: 'green', value: null, hint: '' },
]

const tones = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-yellow-50 text-yellow-700',
}

const shortcuts = [
  { label: 'Tambah Guru', icon: 'user-plus', tone: 'blue' },
  { label: 'Tambah Siswa', icon: 'cap', tone: 'blue' },
  { label: 'Export / Import', icon: 'file', tone: 'green' },
  { label: 'Penempatan', icon: 'pin', tone: 'amber' },
  { label: 'Data Master', icon: 'database', tone: 'blue', to: '/admin/data-master' },
  { label: 'Pengaturan', icon: 'settings', tone: 'amber' },
]
</script>