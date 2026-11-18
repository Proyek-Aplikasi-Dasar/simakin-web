<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Pengguna' }, { label: 'Siswa PKL' }]"
      title="Siswa PKL"
      subtitle="Kelola data siswa, penempatan, dan alokasi guru pembimbing."
    >
      <router-link
        to="/admin/export-import"
        class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold leading-5 hover:bg-slate-50"
      >
        <AppIcon name="file-text" class="h-5 w-5" />
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
      <section class="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" :loading="loading" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Daftar Siswa" description="Seluruh siswa peserta praktik kerja lapangan." />

        <div class="flex gap-6 overflow-x-auto border-b border-slate-200 px-4 sm:px-6">
          <button
            v-for="t in tabs"
            :key="t.key"
            type="button"
            :class="[
              'flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-semibold',
              t.key === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900',
            ]"
            @click="selectTab(t.key)"
          >
            {{ t.label }}
            <span
              v-if="ready"
              :class="[
                'rounded-full px-2 py-0.5 text-[11px]',
                t.key === tab ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500',
              ]"
            >
              {{ counts[t.key] }}
            </span>
            <span v-else-if="loading" class="h-5 w-7 animate-pulse rounded-full bg-slate-200" aria-hidden="true"></span>
          </button>
        </div>

        <div v-if="error" class="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p class="text-sm text-red-600">{{ error }}</p>
          <button
            type="button"
            class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50"
            @click="load"
          >
            Coba lagi
          </button>
        </div>

        <BaseTable
          v-else
          v-model:page="page"
          v-model:search="search"
          bare
          :columns="columns"
          :data="tabRows"
          :per-page="PAGE_SIZE"
          apply-button
          :loading="loading"
          :filters="filters"
          :filter-state="filterState"
          :search-keys="['name', 'nis']"
          search-placeholder="Cari nama / NIS siswa…"
          entity="siswa"
        >
          <template #cell-name="{ row }">
            <div class="flex min-w-0 items-center gap-2.5">
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
          </template>

          <template #cell-status="{ row }">
            <span
              :class="['inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', PKL_STATUS[row.status].box]"
            >
              <span :class="['h-1.5 w-1.5 rounded-full', PKL_STATUS[row.status].dot]" />
              {{ PKL_STATUS[row.status].label }}
            </span>
          </template>

          <template #actions="{ row }">
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
          </template>
        </BaseTable>
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
import BaseTable from '../../components/BaseTable.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { useListState } from '../../composables/useListState'

const toast = useToastStore()
const PAGE_SIZE = 20

const tabs = [
  { key: 'semua', label: 'Semua' },
  { key: 'aktif', label: 'Aktif PKL' },
  { key: 'belum', label: 'Belum Ditempatkan' },
  { key: 'selesai', label: 'Selesai' },
]

// Kolom tabel; urutan, pencarian, filter, dan pagination ditangani BaseTable
const columns = [
  { key: 'name', label: 'Siswa' },
  { key: 'jurusan', label: 'Program Studi', width: 'w-[176px]', cellClass: 'sm:truncate' },
  { key: 'tempat', label: 'Tempat PKL', width: 'w-[176px]', cellClass: 'sm:truncate' },
  { key: 'pembimbing', label: 'Pembimbing', width: 'w-[176px]', cellClass: 'sm:truncate' },
  { key: 'status', label: 'Status', width: 'w-[196px]', sortValue: (r) => PKL_STATUS[r.status].label },
]

const siswa = ref([])
const lokasiMap = ref(new Map())
const pengajuanPending = ref(null)
const loading = ref(true)
const error = ref('')
const page = ref(1)
const search = ref('')
const tab = ref('semua')
const filterState = reactive({ jurusanId: '', guruId: '' })

const toDelete = ref(null)
const deleting = ref(false)

useListState('siswa', ['/admin/master-data/siswa/'], {
  snapshot: () => ({ page: page.value, tab: tab.value, search: search.value, filter: { ...filterState } }),
  restore: (s) => {
    page.value = s.page
    tab.value = s.tab ?? 'semua'
    search.value = s.search ?? ''
    Object.assign(filterState, s.filter ?? {})
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

const tabRows = computed(() => (tab.value === 'semua' ? all.value : all.value.filter((r) => r.status === tab.value)))

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

const filters = computed(() => [
  {
    key: 'jurusanId',
    label: 'Program Studi',
    icon: 'building',
    options: jurusanOptions.value.map((j) => ({ value: j.id, label: j.label })),
  },
  {
    key: 'guruId',
    label: 'Pembimbing',
    icon: 'user-check',
    searchable: true,
    options: guruOptions.value.map((g) => ({ value: g.id, label: g.label })),
  },
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
    const { data } = await api.get('/api/pengajuan-pkl', { params: { status: 'pending' } })
    pengajuanPending.value = data.meta?.total ?? null
  } catch {
    pengajuanPending.value = null
  }
}

function selectTab(key) {
  tab.value = key
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
