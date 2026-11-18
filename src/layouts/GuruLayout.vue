<template>
  <div class="flex min-h-screen bg-slate-50 font-sans text-slate-900">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-slate-900/40 lg:hidden print:hidden"
      aria-hidden="true"
      @click="sidebarOpen = false"
    ></div>

    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 flex h-screen w-[272px] shrink-0 flex-col gap-4 border-r border-slate-200 bg-white py-5 transition-transform duration-200 lg:sticky lg:inset-y-auto lg:top-0 lg:z-auto lg:translate-x-0 print:hidden',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <div class="flex shrink-0 items-center gap-3 px-5">
        <img src="../assets/logo-simakin.png" alt="" class="h-10 w-10" />
        <div>
          <p class="text-lg font-bold leading-[26px]">SimakIn</p>
          <p class="text-[11px] font-medium leading-[14px] text-slate-500">SMK Negeri 1 Magelang</p>
        </div>
      </div>

      <nav class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-4 [scrollbar-width:thin] [&>*]:shrink-0">
        <template v-for="group in menu" :key="group.title">
          <p class="pb-1 pl-2.5 pt-3 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">
            {{ group.title }}
          </p>

          <template v-for="item in group.items" :key="item.label">
            <component
              :is="item.children ? 'button' : item.to ? 'router-link' : 'span'"
              :to="item.children ? undefined : item.to"
              :type="item.children ? 'button' : undefined"
              :aria-expanded="item.children ? isOpen(item) : undefined"
              :title="item.to || item.children ? undefined : 'Segera hadir'"
              @click="item.children ? toggle(item) : undefined"
              :class="[
                'relative flex h-11 w-full items-center gap-3 rounded-xl pl-1.5 pr-2.5 text-sm',
                isActive(item) ? 'bg-blue-600 font-semibold text-white' : 'font-medium text-slate-600',
                item.to || item.children ? (isActive(item) ? '' : 'hover:bg-slate-100') : 'cursor-not-allowed opacity-60',
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
              <AppIcon
                v-if="item.children"
                name="chevron-down"
                :class="['h-4 w-4 transition-transform', isOpen(item) ? 'rotate-180' : '']"
              />
            </component>

            <template v-if="item.children && isOpen(item)">
              <component
                :is="child.to ? 'router-link' : 'span'"
                v-for="child in item.children"
                :key="child.label"
                :to="child.to"
                :title="child.to ? undefined : 'Segera hadir'"
                :class="[
                  'flex h-9 items-center gap-3 rounded-xl pl-[22px] pr-2.5 text-sm',
                  child.to && route.path.startsWith(child.to)
                    ? 'bg-blue-50 font-semibold text-blue-600'
                    : child.to
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'cursor-not-allowed text-slate-600 opacity-60',
                ]"
              >
                <span class="flex h-5 w-5 items-center justify-center">
                  <span
                    :class="[
                      'h-1.5 w-1.5 rounded-full',
                      child.to && route.path.startsWith(child.to) ? 'bg-blue-600' : 'bg-slate-300',
                    ]"
                  ></span>
                </span>
                {{ child.label }}
              </component>
            </template>
          </template>
        </template>
      </nav>

      <div class="mx-4 flex shrink-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-100 p-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <AppIcon name="user" class="h-5 w-5" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold leading-5">{{ auth.user?.name }}</p>
          <p class="text-[11px] leading-[14px] text-slate-500">Guru Pembimbing</p>
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
      <header class="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:gap-4 sm:px-8">
        <div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 lg:hidden"
            aria-label="Buka menu"
            :aria-expanded="sidebarOpen"
            @click="sidebarOpen = true"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <GlobalSearch :menu-items="searchMenu" :search-data="false" />
        </div>

        <div class="flex shrink-0 items-center gap-2 sm:gap-3">
          <span class="hidden items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold leading-4 text-blue-600 xl:flex">
            <AppIcon name="calendar" class="h-4 w-4" />
            {{ today }}
          </span>

          <span
            class="hidden h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 opacity-60 sm:flex"
            aria-label="Chat"
            title="Segera hadir"
          >
            <AppIcon name="message-circle" class="h-5 w-5" />
          </span>

          <span
            class="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 opacity-60"
            aria-label="Notifikasi"
            title="Segera hadir"
          >
            <AppIcon name="bell" class="h-5 w-5" />
          </span>

          <span class="hidden h-8 w-px bg-slate-200 sm:block"></span>

          <div class="flex items-center gap-2.5 pl-1">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <AppIcon name="user" class="h-5 w-5" />
            </span>
            <div class="hidden md:block">
              <p class="text-sm font-semibold leading-5">{{ auth.user?.name }}</p>
              <p class="text-[11px] leading-[14px] text-slate-500">Guru Pembimbing</p>
            </div>
            <AppIcon name="chevron-down" class="hidden h-4 w-4 text-slate-500 md:block" />
          </div>
        </div>
      </header>

      <main class="flex-1 max-md:[&>div]:!p-4">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppIcon from '../components/AppIcon.vue'
import GlobalSearch from '../components/GlobalSearch.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const sidebarOpen = ref(false)
watch(
  () => route.path,
  () => (sidebarOpen.value = false)
)

const today = new Date().toLocaleDateString('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

// tanpa `to` = nonaktif
const menu = [
  { title: 'UTAMA', items: [{ label: 'Dashboard', icon: 'dashboard', to: '/guru', exact: true }] },
  {
    title: 'MONITORING',
    items: [
      {
        label: 'Presensi & Jurnal',
        icon: 'clipboard-check',
        children: [
          { label: 'Presensi Siswa', to: '/guru/presensi-siswa' },
          { label: 'Jurnal Harian' },
          { label: 'Rekap Presensi & Jurnal', to: '/guru/rekap-presensi-jurnal' },
        ],
      },
      { label: 'Penilaian Bulanan', icon: 'chart' },
      { label: 'Nilai Akhir', icon: 'award' },
      { label: 'Siswa Bimbingan', icon: 'users' },
      { label: 'Daftar Perusahaan', icon: 'building' },
    ],
  },
  {
    title: 'KOMUNIKASI',
    items: [
      { label: 'Chat', icon: 'message-circle' },
      { label: 'Notifikasi', icon: 'bell' },
    ],
  },
  {
    title: 'AKUN',
    items: [
      { label: 'Profil', icon: 'user' },
      { label: 'Pengaturan', icon: 'settings' },
    ],
  },
]

const searchMenu = menu.flatMap((g) =>
  g.items.flatMap((item) =>
    item.children
      ? item.children.filter((c) => c.to).map((c) => ({ label: c.label, to: c.to, icon: item.icon, group: item.label }))
      : item.to
        ? [{ label: item.label, to: item.to, icon: item.icon, group: g.title }]
        : []
  )
)

const openGroups = ref({})

function isOpen(item) {
  return openGroups.value[item.label] ?? true
}

function toggle(item) {
  openGroups.value = { ...openGroups.value, [item.label]: !isOpen(item) }
}

function isActive(item) {
  if (!item.to || item.children) return false
  return item.exact ? route.path === item.to : route.path.startsWith(item.to)
}

async function handleLogout() {
  await auth.logout()
  router.push('/')
}
</script>
