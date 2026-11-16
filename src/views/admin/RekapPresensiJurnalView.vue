<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Monitoring' }, { label: 'Rekap Presensi & Jurnal' }]"
      title="Rekap Presensi & Jurnal"
      subtitle="Rekap kehadiran dan jurnal seluruh siswa per periode dan program studi."
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
      <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" :loading="loading" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Rekap per Siswa" description="Perbandingan kehadiran dan jurnal siswa." />

        <form class="flex flex-wrap items-center gap-3 px-6 py-4 print:hidden" @submit.prevent="applyFilters">
          <label class="flex h-10 min-w-[240px] flex-1 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-100 px-3 focus-within:ring-2 focus-within:ring-blue-200">
            <AppIcon name="search" class="h-5 w-5 shrink-0 text-slate-400" />
            <input
              ref="searchInput"
              v-model="draft.search"
              type="text"
              placeholder="Cari nama / NIS siswa…"
              class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <span class="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium leading-[14px] text-slate-500">Ctrl K</span>
          </label>

          <label class="flex h-10 w-[200px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 focus-within:ring-2 focus-within:ring-blue-200">
            <AppIcon name="calendar" class="h-4 w-4 shrink-0 text-slate-400" />
            <DatePicker v-model="draft.periode" mode="month" bare class="min-w-0 flex-1" />
          </label>

          <SelectDropdown
            v-model="draft.program"
            class="w-[220px]"
            icon="building"
            placeholder="Semua Program"
            :options="programItems"
          />

          <SelectDropdown
            v-model="draft.pembimbing"
            class="w-[220px]"
            icon="user"
            placeholder="Semua Pembimbing"
            :options="pembimbingItems"
          />

          <button type="submit" class="flex h-10 items-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-600 hover:bg-blue-100">
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

        <div v-if="loading" class="divide-y divide-slate-100" role="status" aria-busy="true" aria-label="Memuat rekap">
          <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-6 py-3">
            <div class="flex min-w-0 flex-1 items-center gap-2.5">
              <span class="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200"></span>
              <div class="flex min-w-0 flex-1 flex-col gap-2">
                <span class="h-3 w-36 max-w-full animate-pulse rounded bg-slate-200"></span>
                <span class="h-2.5 w-44 max-w-full animate-pulse rounded bg-slate-100"></span>
              </div>
            </div>
            <span class="h-3 w-[130px] animate-pulse rounded bg-slate-200"></span>
            <div class="flex w-[150px] flex-col gap-2">
              <span class="h-3 w-28 animate-pulse rounded bg-slate-200"></span>
              <span class="h-1.5 w-[120px] animate-pulse rounded-full bg-slate-100"></span>
            </div>
            <div class="flex w-[150px] flex-col gap-2">
              <span class="h-3 w-16 animate-pulse rounded bg-slate-200"></span>
              <span class="h-2.5 w-24 animate-pulse rounded bg-slate-100"></span>
            </div>
            <span class="h-6 w-[139px] animate-pulse rounded-full bg-slate-100"></span>
            <div class="flex w-[48px] justify-end">
              <span class="h-10 w-10 animate-pulse rounded-xl bg-slate-100"></span>
            </div>
          </div>
        </div>
        <div v-else-if="error" class="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p class="text-sm text-red-600">{{ error }}</p>
          <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">Coba lagi</button>
        </div>
        <p v-else-if="!pageRows.length" class="px-6 py-12 text-center text-sm text-slate-400">Belum ada data rekap.</p>

        <div v-else class="divide-y divide-slate-100">
          <div v-for="row in pageRows" :key="row.siswaId" class="flex items-center gap-4 px-6 py-3">
            <div class="flex min-w-0 flex-1 items-center gap-2.5">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <AppIcon name="user" class="h-5 w-5" />
              </span>
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold leading-[18px] text-slate-900">{{ row.nama }}</p>
                <p class="truncate text-[11px] leading-[14px] text-slate-500">NIS {{ row.nis }} · {{ row.program }}</p>
              </div>
            </div>

            <span class="w-[130px] truncate text-xs text-slate-600">{{ row.pembimbing }}</span>

            <div class="flex w-[150px] flex-col gap-1.5">
              <span class="text-xs font-medium leading-[18px] text-slate-900">
                {{ row.hadir }} / {{ row.hariEfektif }} hari · {{ persen(row.hadir, row.hariEfektif) }}%
              </span>
              <div class="h-1.5 w-[120px] overflow-hidden rounded-full bg-slate-200">
                <div
                  :class="['h-full rounded-full', barColor(persen(row.hadir, row.hariEfektif))]"
                  :style="{ width: persen(row.hadir, row.hariEfektif) + '%' }"
                />
              </div>
            </div>

            <!-- Data jurnal belum tersedia di API -->
            <div class="flex w-[150px] flex-col">
              <span class="text-xs font-medium leading-[18px] text-slate-900">—</span>
              <span class="text-[11px] leading-[14px] text-slate-500">Belum tersedia</span>
            </div>

            <div class="w-[139px]">
              <span :class="['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', STATUS[row.status].box]">
                <span :class="['h-1.5 w-1.5 rounded-full', STATUS[row.status].dot]" />
                {{ STATUS[row.status].label }}
              </span>
            </div>

            <div class="flex w-[48px] justify-end">
              <router-link
                :to="`/admin/master-data/siswa/${row.siswaId}/presensi`"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 print:hidden"
                aria-label="Lihat rekap siswa"
                title="Lihat rekap siswa"
              >
                <AppIcon name="eye" class="h-5 w-5" />
              </router-link>
            </div>
          </div>
        </div>

        <DataPagination v-if="!loading" class="print:hidden" v-model:page="page" :last-page="lastPage" :total="filtered.length" :from="from" :to="to" item-label="siswa" />
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import api, { getErrorMessage } from '../../services/api'
import { fetchAllPages, groupBySiswa, parseDate, toIso } from '../../utils/siswa'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'
import DatePicker from '../../components/DatePicker.vue'
import DataPagination from '../../components/DataPagination.vue'
import SelectDropdown from '../../components/SelectDropdown.vue'
import { useListState } from '../../composables/useListState'

const PAGE_SIZE = 5
const AMBANG_BINA = 80 

const STATUS = {
  baik: { label: 'Baik', box: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-700' },
  pembinaan: { label: 'Perlu Pembinaan', box: 'border-red-100 bg-red-50 text-red-700', dot: 'bg-red-700' },
}

const columns = [
  { label: 'Siswa', width: 'flex-1', align: '' },
  { label: 'Pembimbing', width: 'w-[130px]', align: '' },
  { label: 'Kehadiran', width: 'w-[150px]', align: '' },
  { label: 'Jurnal', width: 'w-[150px]', align: '' },
  { label: 'Status', width: 'w-[139px]', align: '' },
  { label: 'Aksi', width: 'w-[48px]', align: 'text-right' },
]

const rows = ref([])
const loading = ref(true)
const error = ref('')
const page = ref(1)
const searchInput = ref(null)

const programOptions = ref([])
const pembimbingOptions = ref([])
const programItems = computed(() => [
  { value: '', label: 'Semua Program' },
  ...programOptions.value.map((p) => ({ value: p, label: p })),
])
const pembimbingItems = computed(() => [
  { value: '', label: 'Semua Pembimbing' },
  ...pembimbingOptions.value.map((g) => ({ value: g, label: g })),
])

const draft = reactive({ search: '', periode: bulanIni(), program: '', pembimbing: '' })
const applied = reactive({ ...draft })

// Kembali dari detail siswa -> halaman, periode, dan filter rekap dipulihkan
useListState('admin-rekap-presensi-jurnal', ['/admin/master-data/siswa/'], {
  snapshot: () => ({ page: page.value, applied: { ...applied } }),
  restore: (s) => {
    page.value = s.page
    Object.assign(applied, s.applied)
    Object.assign(draft, s.applied)
  },
})

// Bulan berjalan (zona waktu lokal) dalam format YYYY-MM
function bulanIni() {
  return new Date().toLocaleDateString('sv-SE').slice(0, 7)
}

// Tanggal awal dan akhir dari input bulan (YYYY-MM)
function rentangPeriode(periode) {
  const [tahun, bulan] = periode.split('-').map(Number)
  return { mulai: new Date(tahun, bulan - 1, 1), selesai: new Date(tahun, bulan, 0) }
}

// Jumlah hari kerja (Senin-Jumat) antara dua tanggal, inklusif
function hitungHariKerja(mulai, selesai) {
  let n = 0
  for (let d = new Date(mulai); d <= selesai; d.setDate(d.getDate() + 1)) {
    const h = d.getDay()
    if (h !== 0 && h !== 6) n++
  }
  return n
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { mulai, selesai } = rentangPeriode(applied.periode)
    const [rekapRes, lokasiList, siswaList] = await Promise.all([
      api.get('/api/absensi/rekap', { params: { tanggal_mulai: toIso(mulai), tanggal_selesai: toIso(selesai) } }),
      fetchAllPages('/api/lokasi-pkl'),
      fetchAllPages('/api/siswa'),
    ])

    const rekap = new Map((rekapRes.data.data ?? []).map((r) => [r.siswa?.id, r]))
    const programById = new Map(siswaList.map((s) => [s.id, s.jurusan?.nama]))
    const hariIni = new Date()
    hariIni.setHours(0, 0, 0, 0)

    rows.value = [...groupBySiswa(lokasiList).entries()]
      .filter(([, lokasi]) => lokasi)
      .map(([siswaId, lokasi]) => {
        const r = rekap.get(siswaId)
        const awal = lokasi.tanggal_mulai ? new Date(Math.max(mulai, parseDate(lokasi.tanggal_mulai))) : mulai
        let akhir = new Date(Math.min(selesai, hariIni))
        if (lokasi.tanggal_selesai) akhir = new Date(Math.min(akhir, parseDate(lokasi.tanggal_selesai)))

        const hariEfektif = Math.max(0, hitungHariKerja(awal, akhir) - (r?.libur ?? 0))
        const hadir = r?.hadir ?? 0
        return {
          siswaId,
          nama: lokasi.siswa?.nama ?? r?.siswa?.nama ?? '—',
          nis: lokasi.siswa?.nis ?? r?.siswa?.nis ?? '—',
          program: programById.get(siswaId) ?? '—',
          pembimbing: lokasi.guru?.nama ?? '—',
          hadir,
          hariEfektif,
          status: hariEfektif > 0 && persen(hadir, hariEfektif) < AMBANG_BINA ? 'pembinaan' : 'baik',
        }
      })

    const unik = (key) => [...new Set(rows.value.map((r) => r[key]).filter((v) => v && v !== '—'))].sort()
    programOptions.value = unik('program')
    pembimbingOptions.value = unik('pembimbing')
  } catch (e) {
    error.value = getErrorMessage(e, 'Gagal memuat rekap.')
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  if (!draft.periode) draft.periode = bulanIni()
  const periodeBerubah = draft.periode !== applied.periode
  Object.assign(applied, draft)
  page.value = 1
  if (periodeBerubah) load()
}

const filtered = computed(() => {
  const q = applied.search.toLowerCase()
  return rows.value.filter(
    (r) =>
      (!q || `${r.nama} ${r.nis}`.toLowerCase().includes(q)) &&
      (!applied.program || r.program === applied.program) &&
      (!applied.pembimbing || r.pembimbing === applied.pembimbing)
  )
})

const stats = computed(() => {
  const list = filtered.value
  const has = list.length > 0
  const hari = has ? Math.max(...list.map((r) => r.hariEfektif)) : null
  const avg = has ? Math.round(list.reduce((a, r) => a + persen(r.hadir, r.hariEfektif), 0) / list.length) : null

  return [
    { label: 'Rata-rata Kehadiran', value: has ? `${avg}%` : null, hint: 'periode terpilih', icon: 'calendar-check', tone: 'green' },
    // Jurnal belum punya endpoint di API, jadi kartu ini tampil kosong
    { label: 'Jurnal Terisi', value: null, hint: '', icon: 'file', tone: 'blue' },
    { label: `Siswa < ${AMBANG_BINA}% Hadir`, value: has ? list.filter((r) => r.status === 'pembinaan').length : null, hint: 'perlu pembinaan', icon: 'alert', tone: 'amber' },
    { label: 'Hari Efektif', value: hari, hint: 'periode terpilih', icon: 'calendar', tone: 'blue' },
  ]
})

const lastPage = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
// Saat mencetak, semua baris hasil filter ikut tercetak (bukan hanya halaman yang sedang dibuka)
const printing = ref(false)
const pageRows = computed(() =>
  printing.value ? filtered.value : filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE)
)
const from = computed(() => (filtered.value.length ? (page.value - 1) * PAGE_SIZE + 1 : 0))
const to = computed(() => Math.min(page.value * PAGE_SIZE, filtered.value.length))

const persen = (val, total) => (total ? Math.min(100, Math.round((val / total) * 100)) : 0)
const barColor = (p) => (p < AMBANG_BINA ? 'bg-red-700' : 'bg-emerald-700')

async function cetak() {
  printing.value = true
  await nextTick()
  window.print()
  printing.value = false
}

// CSV berBOM supaya langsung terbuka rapi di Excel; isinya mengikuti filter yang sedang diterapkan
function exportCsv() {
  const lines = [
    ['Nama', 'NIS', 'Program', 'Pembimbing', 'Hadir', 'Hari Efektif', 'Kehadiran (%)', 'Status'],
    ...filtered.value.map((r) => [
      r.nama,
      r.nis,
      r.program,
      r.pembimbing,
      r.hadir,
      r.hariEfektif,
      persen(r.hadir, r.hariEfektif),
      STATUS[r.status].label,
    ]),
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

watch(filtered, () => {
  if (page.value > lastPage.value) page.value = lastPage.value
})

onMounted(() => {
  window.addEventListener('keydown', onKey)
  load()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>