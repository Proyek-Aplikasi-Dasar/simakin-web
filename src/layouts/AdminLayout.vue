<template>
  <div class="flex min-h-screen bg-slate-50 font-sans text-slate-900">
    <aside class="sticky top-0 flex h-screen w-[272px] shrink-0 flex-col gap-4 border-r border-slate-200 bg-white py-5">
      <div class="flex items-center gap-3 px-5">
        <img src="../assets/logo-simakin.png" alt="" class="h-10 w-10" />
        <div>
          <p class="text-lg font-bold leading-[26px]">SimakIn</p>
          <p class="text-[11px] font-medium leading-[14px] text-slate-500">SMK Negeri 1 Magelang</p>
        </div>
      </div>

      <nav class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-4">
        <template v-for="group in menu" :key="group.title">
          <p class="pb-1 pl-2.5 pt-3 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">
            {{ group.title }}
          </p>

          <template v-for="item in group.items" :key="item.label">
            <component
              :is="item.to ? 'router-link' : 'span'"
              :to="item.to"
              :title="item.to ? undefined : 'Segera hadir'"
              :class="[
                'relative flex h-11 items-center gap-3 rounded-xl pl-1.5 pr-2.5 text-sm',
                isActive(item) ? 'bg-blue-600 font-semibold text-white' : 'font-medium text-slate-600',
                item.to ? (isActive(item) ? '' : 'hover:bg-slate-100') : 'cursor-not-allowed opacity-60',
              ]"
            >
              <span
                v-if="isActive(item)"
                class="absolute -left-2.5 top-3 h-5 w-1 rounded-full bg-yellow-400"
              ></span>

              <span
                :class="[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  isActive(item) ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-600',
                ]"
              >
                <AppIcon :name="item.icon" class="h-[18px] w-[18px]" />
              </span>

              <span class="flex-1 text-left">{{ item.label }}</span>

              <AppIcon v-if="item.children" name="chevron-down" class="h-4 w-4 rotate-180" />
            </component>

            <template v-if="item.children">
              <span
                v-for="child in item.children"
                :key="child"
                class="flex h-9 cursor-not-allowed items-center gap-3 rounded-xl pl-[22px] pr-2.5 text-sm text-slate-600 opacity-60"
                title="Segera hadir"
              >
                <span class="flex h-5 w-5 items-center justify-center">
                  <span class="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                </span>
                {{ child }}
              </span>
            </template>
          </template>
        </template>
      </nav>

      <div class="mx-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-100 p-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <AppIcon name="user" class="h-5 w-5" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold leading-5">{{ auth.user?.name }}</p>
          <p class="text-[11px] leading-[14px] text-slate-500">Administrator</p>
        </div>
        <button
          type="button"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-red-600 hover:bg-red-50"
          aria-label="Keluar"
          @click="handleLogout"
        >
          <AppIcon name="logout" class="h-4 w-4" />
        </button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-[72px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-8">
        <label
          class="flex h-10 w-[360px] max-w-full items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-100 px-3 opacity-70"
          title="Pencarian global segera hadir"
        >
          <AppIcon name="search" class="h-5 w-5 shrink-0 text-slate-400" />
          <input
            type="text"
            disabled
            placeholder="Cari siswa, perusahaan, menu…"
            class="min-w-0 flex-1 cursor-not-allowed bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <span class="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium leading-[14px] text-slate-500">
            Ctrl K
          </span>
        </label>

        <div class="flex items-center gap-3">
          <span class="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold leading-4 text-blue-600">
            <AppIcon name="calendar" class="h-4 w-4" />
            {{ today }}
          </span>

          <span
            class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
            title="Notifikasi (segera hadir)"
          >
            <AppIcon name="bell" class="h-5 w-5" />
          </span>

          <span class="h-8 w-px bg-slate-200"></span>

          <div class="flex items-center gap-2.5 pl-1">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <AppIcon name="user" class="h-5 w-5" />
            </span>
            <div>
              <p class="text-sm font-semibold leading-5">{{ auth.user?.name }}</p>
              <p class="text-[11px] leading-[14px] text-slate-500">Administrator</p>
            </div>
            <AppIcon name="chevron-down" class="h-4 w-4 text-slate-500" />
          </div>
        </div>
      </header>

      <main class="flex-1">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppIcon from '../components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const today = new Date().toLocaleDateString('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})


const menu = [
  { title: 'UTAMA', items: [{ label: 'Dashboard', icon: 'dashboard', to: '/admin', exact: true }] },
  {
    title: 'PENGGUNA',
    items: [
      { label: 'Akun & Peran', icon: 'shield' },
      { label: 'Guru Pembimbing', icon: 'user-check', to: '/admin/master-data/guru' },
      { label: 'Siswa PKL', icon: 'cap', to: '/admin/master-data/siswa' },
    ],
  },
  { title: 'DATA MASTER', items: [{ label: 'Data Master', icon: 'database', to: '/admin/data-master' }] },
  {
    title: 'PKL',
    items: [
      { label: 'Pengajuan PKL', icon: 'clipboard-list' },
      { label: 'Lokasi & Penempatan', icon: 'pin' },
    ],
  },
  {
    title: 'MONITORING',
    items: [
      {
        label: 'Presensi & Jurnal',
        icon: 'clipboard-check',
        children: ['Presensi Siswa', 'Jurnal Harian', 'Rekap Presensi & Jurnal'],
      },
      { label: 'Penilaian', icon: 'chart' },
    ],
  },
  {
    title: 'LAINNYA',
    items: [
      { label: 'Notifikasi', icon: 'bell' },
      { label: 'Pengaturan Sistem', icon: 'settings' },
    ],
  },
]

function isActive(item) {
  if (!item.to) return false
  return item.exact ? route.path === item.to : route.path.startsWith(item.to)
}

async function handleLogout() {
  await auth.logout()
  router.push('/')
}
</script>