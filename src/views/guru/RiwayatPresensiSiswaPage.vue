<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Presensi Siswa', to: backTo }, { label: 'Riwayat Presensi' }]"
      title="Riwayat Presensi Siswa"
      subtitle="Riwayat presensi harian individu siswa."
    >
      <router-link
        :to="backTo"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </router-link>
      <button
        type="button"
        :disabled="!rows.length"
        class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        @click="exportCsv"
      >
        <AppIcon name="download" class="h-4 w-4" />
        Export
      </button>
    </PageHeader>

    <div v-if="forbidden" class="flex flex-col items-center gap-3 py-16 text-center">
      <p class="text-sm text-red-600">{{ forbidden }}</p>
      <router-link :to="backTo" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50">
        Kembali ke Presensi Siswa
      </router-link>
    </div>

    <div v-else class="flex flex-col gap-6">
      <section class="relative overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div class="absolute inset-x-0 top-0 h-14 overflow-hidden bg-blue-600">
          <span class="absolute -top-[90px] right-[160px] h-[180px] w-[180px] rounded-full bg-white/10"></span>
          <span class="absolute right-[40px] top-[10px] h-[120px] w-[120px] rounded-full bg-white/10"></span>
        </div>
        <div class="relative flex items-end gap-6 px-6 pb-5 pt-7">
          <span class="flex shrink-0 rounded-full bg-white p-1">
            <span class="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <AppIcon name="user" class="h-9 w-9" />
            </span>
          </span>
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-lg font-semibold leading-[26px] text-slate-900">{{ siswa?.user?.name ?? '…' }}</h2>
            <p class="truncate text-xs leading-[18px] text-slate-500">{{ subline }}</p>
          </div>
          <span
            v-if="rekap.persen != null"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-[3px] text-xs font-semibold leading-4 text-emerald-700"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-700" />
            Kehadiran {{ rekap.persen }}%
          </span>
        </div>
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader
          title="Riwayat Presensi"
          :description="`Periode ${formatDate(applied.from, true)} – ${formatDate(applied.to, true)} · ${rekap.efektif} hari efektif.`"
        />

        <div class="flex gap-6 overflow-x-auto border-b border-slate-200 px-6">
          <button
            v-for="t in tabs"
            :key="t.key"
            type="button"
            :class="[
              'flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-semibold',
              t.key === activeTab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900',
            ]"
            @click="selectTab(t.key)"
          >
            {{ t.label }}
            <span
              :class="[
                'rounded-full px-2 py-0.5 text-[11px]',
                t.key === activeTab ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500',
              ]"
            >
              {{ t.key === 'semua' ? rows.length : rekap[t.key] }}
            </span>
          </button>
        </div>

        <form class="flex flex-wrap items-center justify-between gap-3 px-6 py-4" @submit.prevent="applyRange">
          <div class="flex items-center gap-2">
            <label class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 focus-within:ring-2 focus-within:ring-blue-200">
              <AppIcon name="calendar" class="h-4 w-4 text-slate-400" />
              <input v-model="range.from" type="date" :max="range.to" class="bg-transparent outline-none" />
            </label>
            <span class="text-xs text-slate-500">s/d</span>
            <label class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 focus-within:ring-2 focus-within:ring-blue-200">
              <AppIcon name="calendar" class="h-4 w-4 text-slate-400" />
              <input v-model="range.to" type="date" :min="range.from" class="bg-transparent outline-none" />
            </label>
          </div>
          <button
            type="submit"
            class="flex h-10 items-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-600 hover:bg-blue-100"
          >
            <AppIcon name="filter" class="h-5 w-5" />
            Terapkan
          </button>
        </form>

        <div class="flex items-center gap-4 border-t border-slate-100 bg-slate-100 px-6 py-2.5">
          <span
            v-for="col in columns"
            :key="col.label"
            :class="[col.width, col.align, 'text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500']"
          >
            {{ col.label }}
          </span>
        </div>

        <p v-if="loading" class="px-6 py-12 text-center text-sm text-slate-400">Memuat riwayat presensi…</p>
        <div v-else-if="error" class="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p class="text-sm text-red-600">{{ error }}</p>
          <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="loadRows">
            Coba lagi
          </button>
        </div>
        <p v-else-if="!pageRows.length" class="px-6 py-12 text-center text-sm text-slate-400">
          Tidak ada data presensi pada periode ini.
        </p>

        <div v-else class="divide-y divide-slate-100">
          <div v-for="r in pageRows" :key="r.id" class="flex items-center gap-4 px-6 py-3.5">
            <span class="w-[130px] text-xs leading-[18px] text-slate-900">{{ formatDate(r.tanggal, true) }}</span>
            <span class="w-[90px] text-xs leading-[18px] text-slate-600">{{ hariName(r.tanggal) }}</span>
            <span class="w-[110px] text-xs leading-[18px] text-slate-600">{{ jamOnly(r.jam_masuk) }}</span>
            <div class="w-[110px]">
              <span
                :class="['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', ABSEN_STATUS[r.status]?.box]"
              >
                <span :class="['h-1.5 w-1.5 rounded-full', ABSEN_STATUS[r.status]?.dot]" />
                {{ ABSEN_STATUS[r.status]?.label ?? r.status }}
              </span>
            </div>
            <span class="flex min-w-0 flex-1 items-center gap-2 text-xs leading-[18px] text-slate-600">
              <AppIcon :name="r.status === 'hadir' && !r.keterangan ? 'building' : 'file'" class="h-4 w-4 shrink-0 text-slate-400" />
              <span class="truncate">{{ r.keterangan || (r.status === 'hadir' ? perusahaanNama : '—') }}</span>
            </span>
            <div class="flex w-[60px] justify-end">
              <router-link
                :to="`${backTo}/${r.id}`"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Lihat detail presensi"
                title="Lihat detail"
              >
                <AppIcon name="eye" class="h-5 w-5" />
              </router-link>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 text-xs text-slate-600">
          <span>
            <template v-if="filtered.length">Menampilkan {{ from }}–{{ to }} dari {{ filtered.length }} hari</template>
            <template v-else>Tidak ada data</template>
          </span>
          <div v-if="lastPage > 1" class="flex items-center gap-1.5">
            <button
              type="button"
              :disabled="page <= 1"
              aria-label="Halaman sebelumnya"
              class="flex h-8 w-8 items-center justify-center rounded-[10px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              @click="goTo(page - 1)"
            >
              <AppIcon name="arrow-left" class="h-4 w-4" />
            </button>
            <template v-for="(p, i) in pageItems" :key="`${p}-${i}`">
              <span v-if="p === '…'" class="flex h-8 w-8 items-center justify-center text-xs font-semibold text-slate-500">…</span>
              <button
                v-else
                type="button"
                :class="[
                  'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold',
                  p === page ? 'bg-blue-600 text-white' : 'border border-slate-100 bg-white text-slate-600 hover:bg-slate-50',
                ]"
                @click="goTo(p)"
              >
                {{ p }}
              </button>
            </template>
            <button
              type="button"
              :disabled="page >= lastPage"
              aria-label="Halaman berikutnya"
              class="flex h-8 w-8 items-center justify-center rounded-[10px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              @click="goTo(page + 1)"
            >
              <AppIcon name="arrow-right" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api, { getErrorMessage } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import {
  fetchAllPages,
  pickLokasi,
  hitungKehadiran,
  formatDate,
  hariName,
  jamOnly,
  toIso,
  ABSEN_STATUS,
} from '../../utils/siswa'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import AppIcon from '../../components/AppIcon.vue'

const props = defineProps({
  id: { type: String, required: true },
})

const auth = useAuthStore()
const toast = useToastStore()
const backTo = '/guru/presensi-siswa'
const PAGE_SIZE = 7

const tabs = [
  { key: 'semua', label: 'Semua' },
  { key: 'hadir', label: 'Hadir' },
  { key: 'izin', label: 'Izin' },
  { key: 'sakit', label: 'Sakit' },
  { key: 'libur', label: 'Libur' },
]

const columns = [
  { label: 'Tanggal', width: 'w-[130px]', align: '' },
  { label: 'Hari', width: 'w-[90px]', align: '' },
  { label: 'Waktu Kirim', width: 'w-[110px]', align: '' },
  { label: 'Status', width: 'w-[110px]', align: '' },
  { label: 'Keterangan', width: 'flex-1', align: '' },
  { label: '', width: 'w-[60px]', align: '' },
]

const today = new Date()
const range = reactive({ from: toIso(new Date(today.getFullYear(), today.getMonth(), 1)), to: toIso(today) })
const applied = reactive({ from: range.from, to: range.to })

const siswa = ref(null)
const lokasi = ref(null)
const rows = ref([])
const loading = ref(true)
const error = ref('')
const forbidden = ref('')
const activeTab = ref('semua')
const page = ref(1)

const perusahaanNama = computed(() => lokasi.value?.perusahaan?.nama ?? '—')
const subline = computed(() =>
  siswa.value
    ? [`NIS ${siswa.value.nis}`, siswa.value.kelas, lokasi.value?.perusahaan?.nama].filter(Boolean).join(' · ')
    : ''
)

const rekap = computed(() => hitungKehadiran(rows.value))
const filtered = computed(() => (activeTab.value === 'semua' ? rows.value : rows.value.filter((r) => r.status === activeTab.value)))
const lastPage = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const pageRows = computed(() => filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
const from = computed(() => (filtered.value.length ? (page.value - 1) * PAGE_SIZE + 1 : 0))
const to = computed(() => Math.min(page.value * PAGE_SIZE, filtered.value.length))

const pageItems = computed(() => {
  const last = lastPage.value
  const cur = page.value
  const set = new Set([1, last, cur - 1, cur, cur + 1])
  if (cur <= 2) set.add(3)
  const sorted = [...set].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b)
  const items = []
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) items.push('…')
    items.push(n)
  })
  return items
})

function selectTab(key) {
  activeTab.value = key
  page.value = 1
}

function goTo(p) {
  if (p < 1 || p > lastPage.value || p === page.value) return
  page.value = p
}

// Username guru = NIP, dicocokkan ke guru.nip di lokasi PKL
async function loadSiswa() {
  try {
    const [s, lok] = await Promise.all([
      api.get(`/api/siswa/${props.id}`),
      api.get(`/api/siswa/${props.id}/lokasi-pkl`),
    ])
    const l = pickLokasi(lok.data.data)
    if (!l?.guru?.nip || l.guru.nip !== auth.user?.username) {
      forbidden.value = 'Siswa ini bukan siswa bimbingan Anda.'
      return false
    }
    siswa.value = s.data.data
    lokasi.value = l
    return true
  } catch (err) {
    error.value = getErrorMessage(err, 'Gagal memuat data siswa.')
    return false
  }
}

async function loadRows() {
  loading.value = true
  error.value = ''
  try {
    rows.value = await fetchAllPages('/api/absensi', {
      siswa_id: props.id,
      tanggal_mulai: applied.from,
      tanggal_selesai: applied.to,
    })
    page.value = 1
  } catch (err) {
    rows.value = []
    error.value = getErrorMessage(err, 'Gagal memuat riwayat presensi.')
  } finally {
    loading.value = false
  }
}

function applyRange() {
  if (!range.from || !range.to || range.from > range.to) {
    toast.show('Rentang tanggal tidak valid.', 'error')
    return
  }
  applied.from = range.from
  applied.to = range.to
  loadRows()
}

function exportCsv() {
  const lines = [
    ['Tanggal', 'Hari', 'Waktu Kirim', 'Status', 'Keterangan'],
    ...rows.value.map((r) => [
      r.tanggal,
      hariName(r.tanggal),
      jamOnly(r.jam_masuk),
      ABSEN_STATUS[r.status]?.label ?? r.status,
      r.keterangan ?? '',
    ]),
  ]
  const csv = '\ufeff' + lines.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `presensi-${siswa.value?.nis ?? props.id}-${applied.from}_${applied.to}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  // Data presensi baru dimuat setelah dipastikan siswa ini bimbingan guru yang login
  if (await loadSiswa()) loadRows()
  else loading.value = false
})
</script>
