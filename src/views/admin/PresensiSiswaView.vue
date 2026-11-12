<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Monitoring' }, { label: 'Presensi Siswa' }]"
      title="Presensi Siswa"
      subtitle="Presensi dibuka 07:00 – 11:00 WIB, satu kali per hari. Siswa mengisi jam shift sendiri."
    >
      <router-link
        to="/admin/presensi-siswa/tambah"
        class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold leading-5 text-white hover:bg-blue-700"
      >
        <AppIcon name="calendar-check" class="h-5 w-5" />
        Tambah Presensi
      </router-link>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Presensi Hari Ini" :description="`${tanggalPanjang} · ${applied.jurusan || 'semua program studi'}.`" />

        <div class="flex gap-6 overflow-x-auto border-b border-slate-200 px-6">
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
            <span :class="['rounded-full px-2 py-0.5 text-[11px] leading-[14px]', tab === t.key ? 'bg-blue-50' : 'bg-slate-200']">
              {{ t.count }}
            </span>
          </button>
        </div>

        <form class="flex flex-wrap items-center gap-3 px-6 py-4" @submit.prevent="applyFilters">
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
            <input v-model="draft.tanggal" type="date" class="min-w-0 flex-1 bg-transparent outline-none" />
          </label>

          <SelectDropdown
            v-model="draft.jurusan"
            class="w-[220px]"
            icon="building"
            placeholder="Semua Program Studi"
            :options="jurusanItems"
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

        <p v-if="loading" class="px-6 py-12 text-center text-sm text-slate-400">Memuat data presensi…</p>
        <div v-else-if="error" class="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p class="text-sm text-red-600">{{ error }}</p>
          <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">Coba lagi</button>
        </div>
        <p v-else-if="!pageRows.length" class="px-6 py-12 text-center text-sm text-slate-400">Tidak ada data presensi.</p>

        <div v-else class="divide-y divide-slate-100">
          <div v-for="row in pageRows" :key="row.siswaId" class="flex items-center gap-4 px-6 py-3">
            <div class="flex min-w-0 flex-1 items-center gap-2.5">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <AppIcon name="user" class="h-5 w-5" />
              </span>
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold leading-[18px] text-slate-900">{{ row.nama }}</p>
                <p class="truncate text-[11px] leading-[14px] text-slate-500">{{ row.kelas || row.nis }}</p>
              </div>
            </div>

            <span class="w-[190px] truncate text-xs text-slate-600">{{ row.perusahaan }}</span>
            <span class="w-[96px] text-xs text-slate-600">{{ row.jam }}</span>

            <div class="w-[128px]">
              <span :class="['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', PRESENSI_STATUS[row.status].box]">
                <span :class="['h-1.5 w-1.5 rounded-full', PRESENSI_STATUS[row.status].dot]" />
                {{ PRESENSI_STATUS[row.status].label }}
              </span>
            </div>

            <div class="flex w-[90px] justify-end gap-2">
              <router-link
                :to="detailLink(row)"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Lihat presensi"
                title="Lihat detail presensi"
              >
                <AppIcon name="eye" class="h-5 w-5" />
              </router-link>
              <router-link
                :to="editLink(row)"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Edit presensi"
                title="Edit presensi"
              >
                <AppIcon name="pencil" class="h-5 w-5" />
              </router-link>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 text-xs text-slate-600">
          <span>
            <template v-if="filtered.length">Menampilkan {{ from }}–{{ to }} dari {{ filtered.length }} siswa</template>
            <template v-else>Tidak ada siswa</template>
          </span>

          <div v-if="lastPage > 1" class="flex items-center gap-1.5">
            <button
              type="button"
              :disabled="page <= 1"
              aria-label="Halaman sebelumnya"
              class="flex h-8 w-8 items-center justify-center rounded-[10px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              @click="page--"
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
                @click="page = p"
              >
                {{ p }}
              </button>
            </template>

            <button
              type="button"
              :disabled="page >= lastPage"
              aria-label="Halaman berikutnya"
              class="flex h-8 w-8 items-center justify-center rounded-[10px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              @click="page++"
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
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { getErrorMessage } from '../../services/api'
import { fetchAllPages, groupBySiswa, jamOnly, parseDate, toIso, hariName, formatDate } from '../../utils/siswa'
import { PRESENSI_STATUS } from '../../utils/presensi'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'
import SelectDropdown from '../../components/SelectDropdown.vue'
import { useListState } from '../../composables/useListState'

const PAGE_SIZE = 6

const columns = [
  { label: 'Siswa', width: 'flex-1', align: '' },
  { label: 'Perusahaan', width: 'w-[190px]', align: '' },
  { label: 'Waktu Kirim', width: 'w-[96px]', align: '' },
  { label: 'Status', width: 'w-[128px]', align: '' },
  { label: 'Aksi', width: 'w-[90px]', align: 'text-right' },
]

const rows = ref([])
const loading = ref(true)
const error = ref('')
const page = ref(1)
const tab = ref('semua')
const searchInput = ref(null)

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

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [lokasi, siswa, absensi] = await Promise.all([
    fetchAllPages('/api/lokasi-pkl', { status: 'active' }),
    fetchAllPages('/api/siswa'),
    fetchAllPages('/api/absensi', { tanggal: applied.tanggal }),
    ])
    const siswaMap = new Map(siswa.map((s) => [s.id, s]))
    const absMap = new Map(absensi.map((a) => [a.siswa_id, a]))

    rows.value = [...groupBySiswa(lokasi).values()]
      .filter(Boolean)
      .map((l) => {
        const s = siswaMap.get(l.siswa.id)
        const a = absMap.get(l.siswa.id)
        return {
          siswaId: l.siswa.id,
          absensiId: a?.id ?? null,
          nama: l.siswa.nama,
          nis: l.siswa.nis,
          kelas: s?.kelas ?? '',
          jurusan: s?.jurusan?.nama ?? '',
          perusahaan: l.perusahaan?.nama ?? '—',
          jam: a ? jamOnly(a.jam_masuk) : '—',
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
  return [
    { label: 'Hadir', value: hadir, hint: total ? `${Math.round((hadir / total) * 100)}% siswa aktif` : '', icon: 'user-check', tone: 'green' },
    { label: 'Izin', value: count('izin'), hint: 'siswa hari ini', icon: 'file', tone: 'blue' },
    { label: 'Sakit', value: count('sakit'), hint: 'siswa hari ini', icon: 'alert', tone: 'amber' },
    { label: 'Belum Presensi', value: count('belum'), hint: 'siswa belum mengirim presensi', icon: 'circle-x', tone: 'red' },
  ]
})

const filtered = computed(() => (tab.value === 'semua' ? base.value : base.value.filter((r) => r.status === tab.value)))
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

const tanggalPanjang = computed(() => {
  const d = parseDate(applied.tanggal)
  return d ? `${hariName(applied.tanggal)}, ${formatDate(applied.tanggal)}` : ''
})

const detailLink = (r) =>
  r.absensiId
    ? `/admin/presensi-siswa/${r.absensiId}`
    : `/admin/presensi-siswa/belum/${r.siswaId}?tanggal=${applied.tanggal}`

const editLink = (r) =>
  r.absensiId
    ? `/admin/presensi-siswa/${r.absensiId}/edit`
    : `/admin/presensi-siswa/tambah?siswa_id=${r.siswaId}&tanggal=${applied.tanggal}`

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