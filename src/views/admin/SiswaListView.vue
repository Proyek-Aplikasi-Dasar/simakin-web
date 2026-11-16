<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Pengguna' }, { label: 'Siswa PKL' }]"
      title="Siswa PKL"
      subtitle="Kelola data siswa, penempatan, dan alokasi guru pembimbing."
    >
      <router-link
        to="/admin/export-import"
        class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold leading-5 hover:bg-slate-50"
      >
        <AppIcon name="file" class="h-5 w-5" />
        Export / Import
      </router-link>
      <router-link
        to="/admin/master-data/siswa/tambah"
        class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold leading-5 text-white hover:bg-blue-700"
      >
        <AppIcon name="user-plus" class="h-5 w-5" />
        Tambah Siswa
      </router-link>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" :loading="loading" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Daftar Siswa" description="Seluruh siswa peserta praktik kerja lapangan." />

        <div class="flex gap-6 overflow-x-auto border-b border-slate-200 px-6">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            :class="[
              'flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-semibold',
              tab.key === applied.tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900',
            ]"
            @click="selectTab(tab.key)"
          >
            {{ tab.label }}
            <span
              v-if="ready"
              :class="[
                'rounded-full px-2 py-0.5 text-[11px]',
                tab.key === applied.tab ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500',
              ]"
            >
              {{ counts[tab.key] }}
            </span>
          </button>
        </div>

        <form class="flex flex-wrap items-center gap-3 px-6 py-4" @submit.prevent="applyFilters">
          <label
            class="flex h-10 min-w-[240px] flex-1 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-100 px-3 focus-within:ring-2 focus-within:ring-blue-200"
          >
            <AppIcon name="search" class="h-5 w-5 shrink-0 text-slate-400" />
            <input
              ref="searchInput"
              v-model="draftSearch"
              type="text"
              placeholder="Cari nama / NIS siswa…"
              class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <span class="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium leading-[14px] text-slate-500">
              Ctrl K
            </span>
          </label>

          <SelectDropdown
            v-model="draftJurusan"
            class="w-[220px]"
            icon="building"
            placeholder="Semua Program Studi"
            :options="jurusanItems"
          />

          <SelectDropdown
            v-model="draftGuru"
            class="w-[220px]"
            icon="user-check"
            placeholder="Semua Pembimbing"
            searchable
            :options="guruItems"
          />

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

        <SkeletonRows v-if="loading" :rows="8" :cols="4" />
        <div v-else-if="error" class="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p class="text-sm text-red-600">{{ error }}</p>
          <button
            type="button"
            class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50"
            @click="load"
          >
            Coba lagi
          </button>
        </div>
        <p v-else-if="!pageRows.length" class="px-6 py-12 text-center text-sm text-slate-400">
          Tidak ada siswa yang cocok.
        </p>

        <div v-else class="divide-y divide-slate-100">
          <div v-for="row in pageRows" :key="row.id" class="flex items-center gap-4 px-6 py-3">
            <div class="flex min-w-0 flex-1 items-center gap-2.5">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <AppIcon name="user" class="h-5 w-5" />
              </span>
              <div class="flex min-w-0 flex-col">
                <span class="truncate text-xs font-semibold leading-[18px] text-slate-900">{{ row.name }}</span>
                <span class="truncate text-[11px] leading-[14px] text-slate-500">
                  NIS {{ row.nis }}<template v-if="row.kelas"> · {{ row.kelas }}</template>
                </span>
              </div>
            </div>

            <span class="w-[100px] truncate text-xs leading-[18px] text-slate-600">{{ row.jurusan }}</span>
            <span class="w-[170px] truncate text-xs leading-[18px] text-slate-600">{{ row.tempat }}</span>
            <span class="w-[150px] truncate text-xs leading-[18px] text-slate-600">{{ row.pembimbing }}</span>

            <div class="w-[150px]">
              <span
                :class="['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', PKL_STATUS[row.status].box]"
              >
                <span :class="['h-1.5 w-1.5 rounded-full', PKL_STATUS[row.status].dot]" />
                {{ PKL_STATUS[row.status].label }}
              </span>
            </div>

            <div class="flex w-[148px] justify-end gap-2">
              <router-link
                :to="`/admin/master-data/siswa/${row.id}`"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Lihat detail"
                title="Lihat detail"
              >
                <AppIcon name="eye" class="h-5 w-5" />
              </router-link>
              <router-link
                :to="`/admin/master-data/siswa/${row.id}/edit`"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Edit siswa"
                title="Edit siswa"
              >
                <AppIcon name="pencil" class="h-5 w-5" />
              </router-link>
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600"
                aria-label="Hapus siswa"
                title="Hapus siswa"
                @click="toDelete = row"
              >
                <AppIcon name="trash" class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <DataPagination v-model:page="page" :last-page="lastPage" :total="filtered.length" :from="from" :to="to" item-label="siswa" />
      </section>
    </div>

    <ConfirmDialog
      :show="!!toDelete"
      title="Hapus siswa?"
      :message="`Data siswa ${toDelete?.name ?? ''} akan dihapus dan akunnya tidak bisa login lagi.`"
      :loading="deleting"
      @cancel="toDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api, { getErrorMessage } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import { fetchAllPages, groupBySiswa, pklStatusOf, PKL_STATUS } from '../../utils/siswa'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'
import DataPagination from '../../components/DataPagination.vue'
import SkeletonRows from '../../components/SkeletonRows.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import SelectDropdown from '../../components/SelectDropdown.vue'
import { useSearchShortcut } from '../../composables/useSearchShortcut'
import { useListState } from '../../composables/useListState'

const toast = useToastStore()
const PAGE_SIZE = 20

const tabs = [
  { key: 'semua', label: 'Semua' },
  { key: 'aktif', label: 'Aktif PKL' },
  { key: 'belum', label: 'Belum Ditempatkan' },
  { key: 'selesai', label: 'Selesai' },
]

const columns = [
  { label: 'Siswa', width: 'flex-1', align: '' },
  { label: 'Program Studi', width: 'w-[100px]', align: '' },
  { label: 'Tempat PKL', width: 'w-[170px]', align: '' },
  { label: 'Pembimbing', width: 'w-[150px]', align: '' },
  { label: 'Status', width: 'w-[150px]', align: '' },
  { label: 'Aksi', width: 'w-[148px]', align: 'text-right' },
]

const siswa = ref([])
const lokasiMap = ref(new Map())
const pengajuanPending = ref(null)
const loading = ref(true)
const error = ref('')
const page = ref(1)

const draftSearch = ref('')
const draftJurusan = ref('')
const draftGuru = ref('')
const applied = reactive({ search: '', jurusan: '', guru: '', tab: 'semua' })

const toDelete = ref(null)
const deleting = ref(false)
const searchInput = ref(null)
useSearchShortcut(searchInput)

// Kembali dari detail/edit -> halaman, tab, pencarian, dan filter daftar dipulihkan
useListState('siswa', ['/admin/master-data/siswa/'], {
  snapshot: () => ({ page: page.value, applied: { ...applied } }),
  restore: (s) => {
    page.value = s.page
    Object.assign(applied, s.applied)
    draftSearch.value = s.applied.search
    draftJurusan.value = s.applied.jurusan
    draftGuru.value = s.applied.guru
  },
})

const ready = computed(() => !loading.value && !error.value)

const all = computed(() =>
  siswa.value.map((s) => {
    const lok = lokasiMap.value.get(s.id)
    return {
      id: s.id,
      name: s.user?.name ?? '—',
      nis: s.nis,
      kelas: s.kelas,
      jurusanId: s.jurusan?.id ?? null,
      jurusan: s.jurusan?.kode || s.jurusan?.nama || '—',
      tempat: lok?.perusahaan?.nama ?? '—',
      guruId: lok?.guru?.id ?? null,
      pembimbing: lok?.guru?.nama ?? '—',
      status: pklStatusOf(lok),
    }
  })
)

const counts = computed(() => ({
  semua: all.value.length,
  aktif: all.value.filter((r) => r.status === 'aktif').length,
  belum: all.value.filter((r) => r.status === 'belum').length,
  selesai: all.value.filter((r) => r.status === 'selesai').length,
}))

const jurusanOptions = computed(() => {
  const map = new Map()
  siswa.value.forEach((s) => s.jurusan && map.set(s.jurusan.id, s.jurusan.nama || s.jurusan.kode))
  return [...map].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label))
})

const guruOptions = computed(() => {
  const map = new Map()
  lokasiMap.value.forEach((lok) => lok?.guru && map.set(lok.guru.id, lok.guru.nama))
  return [...map].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label))
})

const jurusanItems = computed(() => [
  { value: '', label: 'Semua Program Studi' },
  ...jurusanOptions.value.map((j) => ({ value: String(j.id), label: j.label })),
])

const guruItems = computed(() => [
  { value: '', label: 'Semua Pembimbing' },
  ...guruOptions.value.map((g) => ({ value: String(g.id), label: g.label })),
])

const stats = computed(() => {
  const total = counts.value.semua
  const pct = total ? Math.round((counts.value.aktif / total) * 100) : 0
  const r = ready.value
  return [
    { label: 'Total Siswa PKL', icon: 'cap', tone: 'blue', value: r ? total : null, hint: 'siswa terdaftar di sistem' },
    { label: 'Sudah Ditempatkan', icon: 'pin', tone: 'green', value: r ? counts.value.aktif : null, hint: `${pct}% dari total siswa` },
    {
      label: 'Belum Ditempatkan',
      icon: 'hourglass',
      tone: 'amber',
      value: r ? counts.value.belum : null,
      hint: pengajuanPending.value != null ? `${pengajuanPending.value} pengajuan menunggu` : 'perlu ditempatkan',
    },
    { label: 'Selesai PKL', icon: 'award', tone: 'blue', value: r ? counts.value.selesai : null, hint: 'penempatan telah selesai' },
  ]
})

const filtered = computed(() => {
  const q = applied.search.toLowerCase()
  return all.value.filter(
    (r) =>
      (applied.tab === 'semua' || r.status === applied.tab) &&
      (!applied.jurusan || String(r.jurusanId) === applied.jurusan) &&
      (!applied.guru || String(r.guruId) === applied.guru) &&
      (!q || r.name.toLowerCase().includes(q) || String(r.nis).toLowerCase().includes(q))
  )
})

const lastPage = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const pageRows = computed(() => filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
const from = computed(() => (filtered.value.length ? (page.value - 1) * PAGE_SIZE + 1 : 0))
const to = computed(() => Math.min(page.value * PAGE_SIZE, filtered.value.length))

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [s, l] = await Promise.all([fetchAllPages('/api/siswa'), fetchAllPages('/api/lokasi-pkl')])
    siswa.value = s
    lokasiMap.value = groupBySiswa(l)
  } catch (err) {
    siswa.value = []
    error.value = getErrorMessage(err, 'Gagal memuat data siswa.')
  } finally {
    loading.value = false
  }
}

async function loadPengajuan() {
  try {
    // Bukan dari /api/dashboard/admin: ringkasan itu di-cache BE 10 menit sehingga angkanya bisa basi
    const { data } = await api.get('/api/pengajuan-pkl', { params: { status: 'pending' } })
    pengajuanPending.value = data.meta?.total ?? null
  } catch {
    pengajuanPending.value = null
  }
}

function applyFilters() {
  applied.search = draftSearch.value.trim()
  applied.jurusan = draftJurusan.value
  applied.guru = draftGuru.value
  page.value = 1
}

function selectTab(key) {
  applied.tab = key
  page.value = 1
}

async function confirmDelete() {
  const target = toDelete.value
  if (!target || deleting.value) return
  deleting.value = true
  try {
    const { data } = await api.delete(`/api/siswa/${target.id}`)
    toast.show(data.message || 'Siswa berhasil dihapus.')
    siswa.value = siswa.value.filter((s) => s.id !== target.id)
    if (page.value > lastPage.value) page.value = lastPage.value
  } catch (err) {
    const status = err.response?.status
    if (status && status < 500 && ![401, 403, 419, 429].includes(status)) {
      toast.show(getErrorMessage(err), 'error')
    }
  } finally {
    deleting.value = false
    toDelete.value = null
  }
}

onMounted(() => {
  load()
  loadPengajuan()
})
</script>