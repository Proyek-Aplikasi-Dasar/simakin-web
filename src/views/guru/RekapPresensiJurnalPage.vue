<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Monitoring' }, { label: 'Rekap Presensi & Jurnal' }]"
      title="Rekap Presensi & Jurnal"
      subtitle="Rekap kehadiran dan jurnal harian siswa per periode."
    >
      <button
        type="button"
        :disabled="!filtered.length"
        class="flex h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold leading-5 text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 print:hidden"
        @click="exportCsv"
      >
        <AppIcon name="file-text" class="h-5 w-5 text-slate-600" />
        Export CSV
      </button>
      <button
        type="button"
        :disabled="!filtered.length"
        class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold leading-5 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 print:hidden"
        @click="cetak"
      >
        <AppIcon name="printer" class="h-5 w-5" />
        Cetak Rekap
      </button>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section class="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" :loading="loading" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Daftar Rekap Presensi & Jurnal" description="Ringkasan perbandingan kehadiran dan jurnal siswa." />

        <form class="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6 print:hidden" @submit.prevent="applyFilters">
          <label class="flex h-10 w-full min-w-0 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-100 px-3 focus-within:ring-2 focus-within:ring-blue-200 sm:min-w-[240px] sm:flex-1">
            <AppIcon name="search" class="h-5 w-5 shrink-0 text-slate-400" />
            <input
              ref="searchInput"
              v-model="draft.search"
              type="text"
              placeholder="Cari nama / NIS siswa…"
              class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <span class="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium leading-[14px] text-slate-500 md:block">Ctrl K</span>
          </label>

          <label class="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 focus-within:ring-2 focus-within:ring-blue-200 sm:w-[200px]">
            <AppIcon name="calendar" class="h-4 w-4 shrink-0 text-slate-400" />
            <DatePicker v-model="draft.periode" mode="month" :max="bulanIni" bare class="min-w-0 flex-1" />
          </label>

          <SelectDropdown
            v-model="draft.kelas"
            class="w-full sm:w-[200px]"
            icon="users"
            placeholder="Semua Kelas"
            :options="kelasItems"
          />

          <button type="submit" class="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-600 hover:bg-blue-100 sm:w-auto">
            <AppIcon name="filter" class="h-5 w-5" />
            Terapkan
          </button>
        </form>

        <div v-if="error" class="flex flex-col items-center gap-3 border-t border-slate-100 px-6 py-12 text-center">
          <p class="text-sm text-red-600">{{ error }}</p>
          <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">Coba lagi</button>
        </div>

        <!-- pas cetak perPage digedein biar semua baris ikut -->
        <AdminTable
          v-else
          v-model:page="page"
          :columns="columns"
          :rows="filtered"
          :per-page="printing ? Math.max(filtered.length, 1) : PAGE_SIZE"
          :loading="loading"
          entity="siswa"
          actions-width="w-[184px]"
        >
          <template #cell-nama="{ row }">
            <div class="flex min-w-0 items-center gap-2.5">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <AppIcon name="user" class="h-5 w-5" />
              </span>
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold leading-[18px] text-slate-900">{{ row.nama }}</p>
                <p class="truncate text-[11px] leading-[14px] text-slate-500">{{ row.kelas || '—' }}</p>
              </div>
            </div>
          </template>

          <template #cell-periode>{{ periodeLabel }}</template>

          <template #cell-kehadiran="{ row }">
            <div class="flex flex-col gap-1.5">
              <template v-if="row.persen !== null">
                <span class="text-xs font-medium leading-[18px] text-slate-900">{{ row.hadir }}/{{ row.efektif }} hari · {{ row.persen }}%</span>
                <div class="h-1.5 w-[120px] overflow-hidden rounded-full bg-slate-200">
                  <div :class="['h-full rounded-full', barColor(row.persen)]" :style="{ width: row.persen + '%' }" />
                </div>
              </template>
              <span v-else class="text-xs text-slate-400">Belum ada presensi</span>
            </div>
          </template>

          <!-- jurnal belum ada -->
          <template #cell-jurnal>
            <div class="flex flex-col">
              <span class="text-xs font-medium leading-[18px] text-slate-900">—</span>
              <span class="text-[11px] leading-[14px] text-slate-500">Belum tersedia</span>
            </div>
          </template>

          <template #actions="{ row }">
            <router-link
              :to="`/guru/presensi-siswa/siswa/${row.siswaId}`"
              class="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold leading-4 text-slate-900 hover:bg-slate-50 print:hidden"
            >
              Presensi
            </router-link>
            <span
              class="flex cursor-not-allowed items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold leading-4 text-slate-900 opacity-60 print:hidden"
              title="Segera hadir"
            >
              Jurnal
            </span>
          </template>
        </AdminTable>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import api, { getErrorMessage } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { fetchAllPages, groupBySiswa, formatDate, toIso, rentangEfektif, hitungEfektif } from '../../utils/siswa'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'
import DatePicker from '../../components/DatePicker.vue'
import AdminTable from '../../components/AdminTable.vue'
import SelectDropdown from '../../components/SelectDropdown.vue'
import { useListState } from '../../composables/useListState'

const PAGE_SIZE = 5
const AMBANG_BINA = 80
const AMBANG_BAIK = 90

// lebar kolom udah include padding 16px
const columns = [
  { key: 'nama', label: 'Nama Siswa' },
  { key: 'nis', label: 'NIS', width: 'w-[96px]' },
  { key: 'periode', label: 'Periode', width: 'w-[96px]' },
  { key: 'kehadiran', label: 'Kehadiran', width: 'w-[166px]' },
  { key: 'jurnal', label: 'Jurnal', width: 'w-[216px]' },
]

const auth = useAuthStore()

const bulanIni = toIso(new Date()).slice(0, 7)
const rows = ref([])
const loading = ref(true)
const error = ref('')
const page = ref(1)
const searchInput = ref(null)
const printing = ref(false)

const draft = reactive({ search: '', periode: bulanIni, kelas: '' })
const applied = reactive({ ...draft })

// balik dari riwayat siswa, state dipulihin
useListState('guru-rekap-presensi-jurnal', ['/guru/presensi-siswa/siswa/'], {
  snapshot: () => ({ page: page.value, applied: { ...applied } }),
  restore: (s) => {
    page.value = s.page
    Object.assign(applied, s.applied)
    Object.assign(draft, s.applied)
  },
})

const periodeLabel = computed(() => formatDate(`${applied.periode}-01`).split(' ').slice(1).join(' '))
const periodeNama = computed(() => {
  const [tahun, bulan] = applied.periode.split('-').map(Number)
  return new Date(tahun, bulan - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
})
// mentok sampe hari ini kalo bulan belum selesai
const rentangLabel = computed(() => {
  const [tahun, bulan] = applied.periode.split('-').map(Number)
  const akhirBulan = new Date(tahun, bulan, 0)
  const akhir = akhirBulan > new Date() ? new Date() : akhirBulan
  return `1 – ${formatDate(toIso(akhir))}`
})

const persen = (hadir, efektif) => (efektif > 0 ? Math.min(100, Math.round((hadir / efektif) * 100)) : null)
const barColor = (p) => (p < AMBANG_BINA ? 'bg-red-700' : p < AMBANG_BAIK ? 'bg-yellow-700' : 'bg-emerald-700')

// username guru = NIP
// hari efektif = hari kerja (Sen-Jum) dalam periode, dipotong masa PKL & hari ini, dikurangi libur
// hari tanpa presensi dianggap ga hadir
async function load() {
  loading.value = true
  error.value = ''
  try {
    const nip = auth.user?.username
    if (!nip) throw new Error('Data akun guru tidak ditemukan.')

    const [tahun, bulan] = applied.periode.split('-').map(Number)
    const [lokasiAktif, siswa, rekapRes] = await Promise.all([
      fetchAllPages('/api/lokasi-pkl', { status: 'active' }),
      fetchAllPages('/api/siswa'),
      api.get('/api/absensi/rekap', {
        params: {
          tanggal_mulai: toIso(new Date(tahun, bulan - 1, 1)),
          tanggal_selesai: toIso(new Date(tahun, bulan, 0)),
        },
      }),
    ])

    const kelasById = new Map(siswa.map((s) => [s.id, s.kelas]))
    const rekap = new Map((rekapRes.data.data ?? []).map((r) => [r.siswa?.id, r]))
    const lokasi = lokasiAktif.filter((l) => l.guru?.nip === nip)

    rows.value = [...groupBySiswa(lokasi).values()]
      .filter(Boolean)
      .map((l) => {
        const r = rekap.get(l.siswa.id)
        const hadir = r?.hadir ?? 0
        const rentang = rentangEfektif(toIso(new Date(tahun, bulan - 1, 1)), toIso(new Date(tahun, bulan, 0)), l)
        const efektif = hitungEfektif(
          { hadir, izin: r?.izin ?? 0, sakit: r?.sakit ?? 0, libur: r?.libur ?? 0 },
          rentang.from,
          rentang.to
        )
        return {
          id: l.siswa.id,
          siswaId: l.siswa.id,
          nama: l.siswa.nama,
          nis: l.siswa.nis,
          kelas: kelasById.get(l.siswa.id) ?? '',
          hadir,
          efektif,
          persen: persen(hadir, efektif),
        }
      })
      .sort((a, b) => a.nama.localeCompare(b.nama))
  } catch (e) {
    error.value = e.message === 'Data akun guru tidak ditemukan.' ? e.message : getErrorMessage(e, 'Gagal memuat rekap.')
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  if (!draft.periode) draft.periode = bulanIni
  const periodeBerubah = draft.periode !== applied.periode
  Object.assign(applied, draft)
  page.value = 1
  if (periodeBerubah) load()
}

const kelasItems = computed(() => [
  { value: '', label: 'Semua Kelas' },
  ...[...new Set(rows.value.map((r) => r.kelas).filter(Boolean))].sort().map((k) => ({ value: k, label: k })),
])

const filtered = computed(() => {
  const q = applied.search.toLowerCase()
  return rows.value.filter(
    (r) => (!q || `${r.nama} ${r.nis}`.toLowerCase().includes(q)) && (!applied.kelas || r.kelas === applied.kelas)
  )
})

const stats = computed(() => {
  // null pas loading biar StatCard tampil skeleton
  const ada = filtered.value.filter((r) => r.persen !== null)
  const has = !loading.value && ada.length > 0
  const avg = has ? Math.round(ada.reduce((a, r) => a + r.persen, 0) / ada.length) : null
  return [
    { label: 'Rata-rata Kehadiran', value: has ? `${avg}%` : null, hint: `periode ${periodeNama.value}`, icon: 'calendar-check', tone: 'green' },
    // jurnal belum ada endpoint, kartu kosong
    { label: 'Jurnal Terisi', value: null, hint: '', icon: 'file', tone: 'blue' },
    { label: `Siswa < ${AMBANG_BINA}% Hadir`, value: has ? ada.filter((r) => r.persen < AMBANG_BINA).length : null, hint: 'perlu pembinaan', icon: 'alert', tone: 'amber' },
    { label: 'Hari Efektif', value: has ? Math.max(...ada.map((r) => r.efektif)) : null, hint: rentangLabel.value, icon: 'calendar', tone: 'blue' },
  ]
})

// cetak semua baris hasil filter, bukan cuma halaman ini
async function cetak() {
  const halaman = page.value
  printing.value = true
  page.value = 1
  await nextTick()
  window.print()
  printing.value = false
  page.value = halaman
}

// pakai BOM biar rapi di Excel, isi ngikut filter
function exportCsv() {
  const lines = [
    ['Nama', 'NIS', 'Kelas', 'Periode', 'Hadir', 'Hari Efektif', 'Kehadiran (%)'],
    ...filtered.value.map((r) => [r.nama, r.nis, r.kelas, periodeLabel.value, r.hadir, r.efektif, r.persen ?? '']),
  ]
  const csv = '﻿' + lines.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `rekap-presensi-${applied.periode}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function onKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  load()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
