<template>
  <div class="p-4 sm:p-6 lg:p-8">
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
        Export CSV
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
        <div class="h-[86px] bg-blue-600"></div>
        <div class="flex flex-col gap-3 px-4 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:px-6">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
            <span class="-mt-10 flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-blue-600">
              <AppIcon name="user" class="h-10 w-10" />
            </span>
            <div class="pb-1">
              <h2 class="text-xl font-bold leading-7 tracking-[-0.02em] text-slate-900">{{ siswa?.user?.name ?? '…' }}</h2>
              <p class="text-sm leading-5 text-slate-600">{{ subline }}</p>
            </div>
          </div>
          <span
            v-if="lokasi"
            :class="['inline-flex items-center gap-1.5 self-start whitespace-nowrap rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', PKL_STATUS[pklStatus].box]"
          >
            <span :class="['h-1.5 w-1.5 rounded-full', PKL_STATUS[pklStatus].dot]" />
            {{ pklStatus === 'aktif' ? 'Aktif PKL' : PKL_STATUS[pklStatus].label }}
          </span>
        </div>

        <div class="grid grid-cols-1 gap-5 border-t border-slate-100 px-4 py-5 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
          <InfoItem icon="building" label="Tempat PKL" :value="lokasi?.perusahaan?.nama" :hint="lokasi?.perusahaan?.alamat" />
          <InfoItem icon="user-check" label="Pembimbing" :value="lokasi?.guru?.nama" />
          <InfoItem icon="calendar" label="Periode" :value="periodePkl" :hint="lokasi?.gelombang?.nama" />
          <InfoItem icon="smartphone" label="Kontak" :value="siswa?.telp" />
        </div>
      </section>

      <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader
          title="Riwayat Presensi"
          :description="`Periode ${formatDate(periode.from, true)} – ${formatDate(periode.to, true)}${loading ? '' : ` · ${rekap.efektif} hari efektif`}.`"
        />

        <div class="flex gap-4 overflow-x-auto border-b border-slate-200 px-4 sm:gap-6 sm:px-6">
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
            <span v-if="loading" class="h-[18px] w-6 animate-pulse rounded-full bg-slate-200"></span>
            <span
              v-else
              :class="[
                'rounded-full px-2 py-0.5 text-[11px]',
                t.key === activeTab ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500',
              ]"
            >
              {{ t.key === 'semua' ? rows.length : rekap[t.key] }}
            </span>
          </button>
        </div>

        <form class="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6" @submit.prevent="applyRange">
          <label class="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 focus-within:ring-2 focus-within:ring-blue-200 sm:w-[200px]">
            <AppIcon name="calendar" class="h-4 w-4 text-slate-400" />
            <DatePicker v-model="range.bulan" mode="month" :max="bulanIni" bare class="min-w-0 flex-1" />
          </label>
          <button
            type="submit"
            class="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-600 hover:bg-blue-100 sm:w-auto"
          >
            <AppIcon name="filter" class="h-5 w-5" />
            Terapkan
          </button>
        </form>

        <div v-if="error" class="flex flex-col items-center gap-3 border-t border-slate-100 px-6 py-12 text-center">
          <p class="text-sm text-red-600">{{ error }}</p>
          <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="loadRows">
            Coba lagi
          </button>
        </div>

        <AdminTable
          v-else
          v-model:page="page"
          :columns="columns"
          :rows="filtered"
          :per-page="PAGE_SIZE"
          :loading="loading"
          entity="hari"
          actions-width="w-[72px]"
        >
          <template #cell-tanggal="{ row }">{{ formatDate(row.tanggal, true) }}</template>
          <template #cell-hari="{ row }">{{ hariName(row.tanggal) }}</template>
          <template #cell-jam_masuk="{ row }">{{ jamOnly(row.jam_masuk) }}</template>
          <template #cell-jam_shift="{ row }">{{ jamShift(row) }}</template>
          <template #cell-status="{ row }">
            <span :class="['inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', ABSEN_STATUS[row.status]?.box]">
              <span :class="['h-1.5 w-1.5 rounded-full', ABSEN_STATUS[row.status]?.dot]" />
              {{ ABSEN_STATUS[row.status]?.label ?? row.status }}
            </span>
          </template>
          <template #cell-keterangan="{ row }">
            <div class="flex min-w-0 items-center gap-2">
              <AppIcon :name="row.status === 'hadir' && !row.keterangan ? 'building' : 'file'" class="h-4 w-4 shrink-0 text-slate-400" />
              <span class="sm:truncate">{{ row.keterangan || (row.status === 'hadir' ? perusahaanNama : '—') }}</span>
            </div>
          </template>
          <template #actions="{ row }">
            <router-link
              :to="`${backTo}/${row.id}`"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Lihat detail presensi"
              title="Lihat detail"
            >
              <AppIcon name="eye" class="h-5 w-5" />
            </router-link>
          </template>
        </AdminTable>
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
  pickLokasi,
  rentangEfektif,
  hitungEfektif,
  formatDate,
  hariName,
  jamOnly,
  toIso,
  pklStatusOf,
  PKL_STATUS,
  ABSEN_STATUS,
} from '../../utils/siswa'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import DatePicker from '../../components/DatePicker.vue'
import AdminTable from '../../components/AdminTable.vue'
import StatCard from '../../components/StatCard.vue'
import InfoItem from '../../components/InfoItem.vue'
import { useListState } from '../../composables/useListState'

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

// lebar kolom udah include padding 16px
const columns = [
  { key: 'tanggal', label: 'Tanggal', width: 'w-[126px]' },
  { key: 'hari', label: 'Hari', width: 'w-[96px]' },
  { key: 'jam_masuk', label: 'Waktu Kirim', width: 'w-[112px]' },
  { key: 'jam_shift', label: 'Jam Shift', width: 'w-[112px]' },
  { key: 'status', label: 'Status', width: 'w-[130px]' },
  { key: 'keterangan', label: 'Keterangan' },
]

// endpoint periode per bulan (bulan + tahun), bukan rentang tanggal
const bulanIni = toIso(new Date()).slice(0, 7)
const range = reactive({ bulan: bulanIni })
const applied = reactive({ bulan: bulanIni })

const periode = computed(() => {
  const [tahun, bulan] = applied.bulan.split('-').map(Number)
  return { from: toIso(new Date(tahun, bulan - 1, 1)), to: toIso(new Date(tahun, bulan, 0)) }
})

const siswa = ref(null)
const lokasi = ref(null)
const rows = ref([])
const rekapBe = ref({ hadir: 0, izin: 0, sakit: 0, libur: 0 })
const loading = ref(true)
const error = ref('')
const forbidden = ref('')
const activeTab = ref('semua')
const page = ref(1)

// balik dari detail, state dipulihin
let restored = false
useListState(`guru-riwayat-presensi-${props.id}`, ['/guru/presensi-siswa/'], {
  snapshot: () => ({ page: page.value, tab: activeTab.value, bulan: applied.bulan }),
  restore: (s) => {
    restored = true
    page.value = s.page
    activeTab.value = s.tab
    applied.bulan = s.bulan
    range.bulan = s.bulan
  },
})

const perusahaanNama = computed(() => lokasi.value?.perusahaan?.nama ?? '—')
const subline = computed(() =>
  siswa.value
    ? [`NIS ${siswa.value.nis}`, siswa.value.kelas, lokasi.value?.perusahaan?.nama].filter(Boolean).join(' · ')
    : ''
)

// hadir/izin/sakit/libur dari BE, hari efektif dihitung di FE (hari kerja dipotong masa PKL & hari ini)
const rekap = computed(() => {
  const c = rekapBe.value
  const total = c.hadir + c.izin + c.sakit + c.libur
  const rentang = rentangEfektif(periode.value.from, periode.value.to, lokasi.value)
  const efektif = hitungEfektif(c, rentang.from, rentang.to)
  return { ...c, total, efektif, persen: efektif > 0 ? Math.round((c.hadir / efektif) * 100) : null }
})
const filtered = computed(() => (activeTab.value === 'semua' ? rows.value : rows.value.filter((r) => r.status === activeTab.value)))

const pklStatus = computed(() => pklStatusOf(lokasi.value))
const periodePkl = computed(() => {
  const g = lokasi.value?.gelombang
  return g?.praktik_mulai && g?.praktik_selesai ? `${formatDate(g.praktik_mulai)} – ${formatDate(g.praktik_selesai)}` : ''
})
const stats = computed(() => [
  {
    label: 'Kehadiran',
    icon: 'calendar-check',
    tone: 'green',
    value: rekap.value.persen != null ? `${rekap.value.persen}%` : null,
    hint: loading.value ? 'memuat…' : `${rekap.value.hadir} dari ${rekap.value.efektif} hari`,
  },
  { label: 'Izin', icon: 'clipboard-list', tone: 'blue', value: loading.value ? null : rekap.value.izin, hint: 'bulan ini' },
  { label: 'Sakit', icon: 'alert', tone: 'amber', value: loading.value ? null : rekap.value.sakit, hint: 'bulan ini' },
  { label: 'Libur', icon: 'calendar', tone: 'blue', value: loading.value ? null : rekap.value.libur, hint: 'bulan ini' },
])

function selectTab(key) {
  activeTab.value = key
  page.value = 1
}

// libur ga punya shift
function jamShift(r) {
  return r.jam_shift_mulai && r.jam_shift_selesai ? `${jamOnly(r.jam_shift_mulai)}–${jamOnly(r.jam_shift_selesai)}` : '—'
}

// username guru = NIP
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
    const [tahun, bulan] = applied.bulan.split('-').map(Number)
    const res = await api.get(`/api/absensi/siswa/${props.id}/periode`, { params: { bulan, tahun } })
    rows.value = [...(res.data.data ?? [])].sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)))
    rekapBe.value = { hadir: 0, izin: 0, sakit: 0, libur: 0, ...(res.data.rekap ?? {}) }
    // load pertama abis restore, jangan reset page
    if (restored) restored = false
    else page.value = 1
  } catch (err) {
    rows.value = []
    rekapBe.value = { hadir: 0, izin: 0, sakit: 0, libur: 0 }
    error.value = getErrorMessage(err, 'Gagal memuat riwayat presensi.')
  } finally {
    loading.value = false
  }
}

function applyRange() {
  if (!range.bulan || range.bulan > bulanIni) {
    toast.show('Bulan tidak valid.', 'error')
    return
  }
  applied.bulan = range.bulan
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
  a.download = `presensi-${siswa.value?.nis ?? props.id}-${applied.bulan}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  // load presensi cuma kalo siswa ini bimbingan guru yg login
  if (await loadSiswa()) loadRows()
  else loading.value = false
})
</script>
