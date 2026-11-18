<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Monitoring' }, { label: 'Presensi Siswa' }]"
      title="Presensi Siswa"
      :subtitle="subtitle"
    >
      <button
        type="button"
        :disabled="exporting"
        class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold leading-5 text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        @click="exportExcel"
      >
        <AppIcon name="file-text" class="h-5 w-5" />
        {{ exporting ? 'Mengekspor…' : 'Ekspor Excel' }}
      </button>
      <router-link
        :to="`/admin/presensi-siswa/tambah?tanggal=${applied.tanggal}`"
        class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold leading-5 text-white hover:bg-blue-700"
      >
        <AppIcon name="calendar-check" class="h-5 w-5" />
        Tambah Presensi
      </router-link>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section class="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" :loading="loading" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Presensi Hari Ini" :description="`${tanggalPanjang} · ${applied.jurusan || 'semua program studi'}.`" />

        <div class="flex gap-6 overflow-x-auto border-b border-slate-200 px-4 sm:px-6">
          <button
            v-for="t in tabs"
            :key="t.key"
            type="button"
            :class="[
              '-mb-px flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-semibold',
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700',
            ]"
            @click="tab = t.key"
          >
            {{ t.label }}
            <span v-if="loading" class="h-[18px] w-6 animate-pulse rounded-full bg-slate-200"></span>
            <span v-else :class="['rounded-full px-2 py-0.5 text-[11px] leading-[14px]', tab === t.key ? 'bg-blue-50' : 'bg-slate-200']">
              {{ t.count }}
            </span>
          </button>
        </div>

        <form class="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6" @submit.prevent="applyFilters">
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
            <DatePicker v-model="draft.tanggal" bare class="min-w-0 flex-1" />
          </label>

          <SelectDropdown
            v-model="draft.jurusan"
            class="w-full sm:w-[220px]"
            icon="building"
            placeholder="Semua Program Studi"
            :options="jurusanItems"
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

        <AdminTable
          v-else
          v-model:page="page"
          :columns="columns"
          :rows="filtered"
          :per-page="PAGE_SIZE"
          :loading="loading"
          entity="siswa"
          actions-width="w-[122px]"
        >
          <template #cell-nama="{ row }">
            <div class="flex min-w-0 items-center gap-2.5">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <AppIcon name="user" class="h-5 w-5" />
              </span>
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold leading-[18px] text-slate-900">{{ row.nama }}</p>
                <p class="truncate text-[11px] leading-[14px] text-slate-500">{{ row.kelas || row.nis }}</p>
              </div>
            </div>
          </template>

          <template #cell-status="{ row }">
            <span :class="['inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', PRESENSI_STATUS[row.status].box]">
              <span :class="['h-1.5 w-1.5 rounded-full', PRESENSI_STATUS[row.status].dot]" />
              {{ PRESENSI_STATUS[row.status].label }}
            </span>
          </template>

          <template #actions="{ row }">
            <router-link
              :to="detailLink(row)"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Lihat presensi"
              title="Lihat detail presensi"
            >
              <AppIcon name="eye" class="h-5 w-5" />
            </router-link>
            <router-link
              v-if="row.absensiId"
              :to="editLink(row)"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Edit presensi"
              title="Edit presensi"
            >
              <AppIcon name="pencil" class="h-5 w-5" />
            </router-link>
            <router-link
              v-else
              :to="tambahLink(row)"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Tambah presensi"
              title="Tambah presensi manual"
            >
              <AppIcon name="pencil" class="h-5 w-5" />
            </router-link>
          </template>
        </AdminTable>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import api, { getErrorMessage } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import { fetchAllPages, groupBySiswa, jamOnly, parseDate, toIso, hariName, formatDate } from '../../utils/siswa'
import { PRESENSI_STATUS } from '../../utils/presensi'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'
import DatePicker from '../../components/DatePicker.vue'
import AdminTable from '../../components/AdminTable.vue'
import SelectDropdown from '../../components/SelectDropdown.vue'
import { useListState } from '../../composables/useListState'

const PAGE_SIZE = 6

const columns = [
  { key: 'nama', label: 'Siswa' },
  { key: 'perusahaan', label: 'Perusahaan', width: 'w-[206px]', cellClass: 'sm:truncate' },
  { key: 'jam', label: 'Waktu Kirim', width: 'w-[112px]' },
  { key: 'jamShift', label: 'Jam Shift', width: 'w-[120px]', cellClass: 'whitespace-nowrap' },
  { key: 'status', label: 'Status', width: 'w-[144px]' },
]

const rows = ref([])
const loading = ref(true)
const error = ref('')
const page = ref(1)
const tab = ref('semua')
const searchInput = ref(null)
const waktuAbsen = ref(null)
const exporting = ref(false)
const toast = useToastStore()

const subtitle = computed(() => {
  const jam = waktuAbsen.value ? `dibuka ${waktuAbsen.value.mulai} – ${waktuAbsen.value.selesai} WIB, ` : ''
  return `Presensi ${jam}satu kali per hari. Siswa mengisi jam shift sendiri.`
})

const draft = reactive({ search: '', tanggal: toIso(new Date()), jurusan: '' })
const applied = reactive({ ...draft })

useListState('presensi-siswa', ['/admin/presensi-siswa/'], {
  snapshot: () => ({ page: page.value, tab: tab.value, applied: { ...applied } }),
  restore: (s) => {
    page.value = s.page
    tab.value = s.tab
    Object.assign(applied, s.applied)
    Object.assign(draft, s.applied)
  },
})

function jamShiftOf(a) {
  return a?.jam_shift_mulai && a?.jam_shift_selesai ? `${jamOnly(a.jam_shift_mulai)}–${jamOnly(a.jam_shift_selesai)}` : '—'
}

async function loadWaktuAbsen() {
  try {
    const res = await api.get('/api/waktu-absen')
    const row = res.data?.data?.[0]
    if (row?.mulai && row?.selesai) waktuAbsen.value = { mulai: jamOnly(row.mulai), selesai: jamOnly(row.selesai) }
  } catch {
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [lokasi, siswa, absensi] = await Promise.all([
    fetchAllPages('/api/lokasi-pkl', { status: 'active' }),
    fetchAllPages('/api/siswa'),
    fetchAllPages('/api/absensi', { tanggal: applied.tanggal }),
    loadWaktuAbsen(),
    ])
    const siswaMap = new Map(siswa.map((s) => [s.id, s]))
    const absMap = new Map(absensi.map((a) => [a.siswa_id, a]))

    rows.value = [...groupBySiswa(lokasi).values()]
      .filter(Boolean)
      .map((l) => {
        const s = siswaMap.get(l.siswa.id)
        const a = absMap.get(l.siswa.id)
        return {
          id: l.siswa.id,
          siswaId: l.siswa.id,
          absensiId: a?.id ?? null,
          nama: l.siswa.nama,
          nis: l.siswa.nis,
          kelas: s?.kelas ?? '',
          jurusan: s?.jurusan?.nama ?? '',
          jurusanId: s?.jurusan?.id ?? null,
          perusahaan: l.perusahaan?.nama ?? '—',
          jam: a ? jamOnly(a.jam_masuk) : '—',
          jamShift: jamShiftOf(a),
          status: a?.status ?? 'belum',
        }
      })
      .sort((x, y) => x.nama.localeCompare(y.nama))
  } catch (e) {
    console.error('Presensi gagal dimuat:', e)
    error.value = getErrorMessage(e, 'Gagal memuat data presensi.')
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  const ganti = draft.tanggal !== applied.tanggal
  Object.assign(applied, draft)
  page.value = 1
  if (ganti) load()
}

const jurusanOptions = computed(() => [...new Set(rows.value.map((r) => r.jurusan).filter(Boolean))].sort())
const jurusanItems = computed(() => [
  { value: '', label: 'Semua Program Studi' },
  ...jurusanOptions.value.map((j) => ({ value: j, label: j })),
])

const base = computed(() => {
  const q = applied.search.toLowerCase()
  return rows.value.filter(
    (r) =>
      (!q || `${r.nama} ${r.nis}`.toLowerCase().includes(q)) &&
      (!applied.jurusan || r.jurusan === applied.jurusan)
  )
})

const count = (st) => base.value.filter((r) => r.status === st).length

const tabs = computed(() => [
  { key: 'semua', label: 'Semua', count: base.value.length },
  { key: 'hadir', label: 'Hadir', count: count('hadir') },
  { key: 'izin', label: 'Izin', count: count('izin') },
  { key: 'sakit', label: 'Sakit', count: count('sakit') },
  { key: 'libur', label: 'Libur', count: count('libur') },
  { key: 'belum', label: 'Belum Presensi', count: count('belum') },
])

const stats = computed(() => {
  const total = base.value.length
  const hadir = count('hadir')
  const v = (n) => (loading.value ? null : n)
  return [
    { label: 'Hadir', value: v(hadir), hint: total ? `${Math.round((hadir / total) * 100)}% siswa aktif` : '', icon: 'user-check', tone: 'green' },
    { label: 'Izin', value: v(count('izin')), hint: 'siswa hari ini', icon: 'file', tone: 'blue' },
    { label: 'Sakit', value: v(count('sakit')), hint: 'siswa hari ini', icon: 'alert', tone: 'amber' },
    { label: 'Belum Presensi', value: v(count('belum')), hint: waktuAbsen.value ? `presensi ditutup ${waktuAbsen.value.selesai} WIB` : '', icon: 'circle-x', tone: 'red' },
  ]
})

const filtered = computed(() => (tab.value === 'semua' ? base.value : base.value.filter((r) => r.status === tab.value)))

const tanggalPanjang = computed(() => {
  const d = parseDate(applied.tanggal)
  return d ? `${hariName(applied.tanggal)}, ${formatDate(applied.tanggal)}` : ''
})

const detailLink = (r) =>
  r.absensiId
    ? `/admin/presensi-siswa/${r.absensiId}`
    : `/admin/presensi-siswa/belum/${r.siswaId}?tanggal=${applied.tanggal}`

const editLink = (r) => `/admin/presensi-siswa/${r.absensiId}/edit`
const tambahLink = (r) => `/admin/presensi-siswa/tambah?siswa_id=${r.siswaId}&tanggal=${applied.tanggal}`

async function exportExcel() {
  if (tab.value === 'belum') {
    toast.show('Siswa yang belum presensi tidak ada di data ekspor.', 'error')
    return
  }
  const params = { tanggal: applied.tanggal }
  if (['hadir', 'izin', 'sakit', 'libur'].includes(tab.value)) params.status = tab.value
  if (applied.search) params.search = applied.search
  if (applied.jurusan) {
    const id = rows.value.find((r) => r.jurusan === applied.jurusan)?.jurusanId
    if (id) params.jurusan_id = id
  }

  exporting.value = true
  try {
    const res = await api.get('/api/absensi/export', { params, responseType: 'blob', skipErrorToast: true })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `presensi-siswa-${applied.tanggal}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.show('Presensi berhasil diekspor.')
  } catch (e) {
    toast.show(getErrorMessage(e, 'Gagal mengekspor presensi.'), 'error')
  } finally {
    exporting.value = false
  }
}

watch(tab, () => (page.value = 1))

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
