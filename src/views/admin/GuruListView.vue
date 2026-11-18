<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Pengguna' }, { label: 'Guru Pembimbing' }]"
      title="Guru Pembimbing"
      subtitle="Kelola data guru pembimbing dan pembagian siswa bimbingan."
    >
      <router-link
        to="/admin/export-import"
        class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold leading-5 hover:bg-slate-50"
      >
        <AppIcon name="file-text" class="h-5 w-5" />
        Export / Import
      </router-link>
      <router-link
        to="/admin/master-data/guru/tambah"
        class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold leading-5 text-white hover:bg-blue-700"
      >
        <AppIcon name="user-plus" class="h-5 w-5" />
        Tambah Guru
      </router-link>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section class="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" :loading="loading" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Daftar Guru Pembimbing" description="Guru pembimbing PKL beserta beban bimbingannya." />

        <div v-if="error" class="flex flex-col items-center gap-3 border-t border-slate-100 px-6 py-12 text-center">
          <p class="text-sm text-red-600">{{ error }}</p>
          <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">
            Coba lagi
          </button>
        </div>

        <BaseTable
          v-else
          v-model:page="page"
          v-model:search="search"
          bare
          :columns="columns"
          :data="all"
          :per-page="PAGE_SIZE"
          apply-button
          :loading="loading"
          :filters="filters"
          :filter-state="filterState"
          :search-keys="['name', 'nip', 'prodi']"
          search-placeholder="Cari nama atau NIP…"
          entity="guru"
        >
          <template #cell-name="{ row }">
            <div class="flex min-w-0 items-center gap-2.5">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <AppIcon name="user" class="h-5 w-5" />
              </span>
              <div class="flex min-w-0 flex-col">
                <span class="truncate text-xs font-semibold leading-[18px] text-slate-900">{{ row.name }}</span>
                <span class="truncate text-[11px] leading-[14px] text-slate-500">NIP {{ row.nip }}</span>
              </div>
            </div>
          </template>

          <template #cell-beban="{ row }">
            <div class="flex w-[120px] flex-col gap-1.5">
              <span class="text-xs font-medium leading-[18px] text-slate-900">{{ row.beban }} / {{ row.kuota ?? '—' }} siswa</span>
              <div class="h-1.5 w-[120px] overflow-hidden rounded-full bg-slate-200">
                <div
                  v-if="row.kuota"
                  :class="['h-full rounded-full', row.beban >= row.kuota ? 'bg-yellow-700' : 'bg-blue-600']"
                  :style="{ width: row.beban ? `${Math.min(100, (row.beban / row.kuota) * 100)}%` : '6px' }"
                />
              </div>
            </div>
          </template>

          <template #cell-perusahaan="{ row }">
            {{ row.perusahaan ? `${row.perusahaan} mitra` : '—' }}
          </template>

          <template #cell-status="{ row }">
            <span :class="['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', STATUS[row.status].box]">
              <span :class="['h-1.5 w-1.5 rounded-full', STATUS[row.status].dot]" />
              {{ STATUS[row.status].label }}
            </span>
          </template>

          <template #actions="{ row }">
            <router-link
              :to="`/admin/master-data/guru/${row.id}`"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Lihat detail"
              title="Lihat detail"
            >
              <AppIcon name="eye" class="h-5 w-5" />
            </router-link>
            <router-link
              :to="`/admin/master-data/guru/${row.id}/edit`"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Edit guru"
              title="Edit guru"
            >
              <AppIcon name="pencil" class="h-5 w-5" />
            </router-link>
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600"
              aria-label="Hapus guru"
              title="Hapus guru"
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
      title="Hapus guru?"
      :message="`Data guru ${toDelete?.name ?? ''} akan dihapus dan akunnya tidak bisa login lagi.`"
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
import { fetchAllPages } from '../../utils/siswa'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'
import BaseTable from '../../components/BaseTable.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { useListState } from '../../composables/useListState'

const toast = useToastStore()
const PAGE_SIZE = 5

const STATUS = {
  aktif: { label: 'Aktif', box: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-700' },
  nonaktif: { label: 'Nonaktif', box: 'border-red-200 bg-red-50 text-red-700', dot: 'bg-red-700' },
}

const columns = [
  { key: 'name', label: 'Guru' },
  { key: 'prodi', label: 'Program Studi', width: 'w-[186px]', cellClass: 'truncate' },
  { key: 'beban', label: 'Beban Bimbingan', width: 'w-[166px]' },
  { key: 'perusahaan', label: 'Perusahaan', width: 'w-[116px]', cellClass: 'whitespace-nowrap' },
  { key: 'status', label: 'Status', width: 'w-[106px]', sortValue: (r) => STATUS[r.status].label },
]

const guru = ref([])
const lokasi = ref([])
const jurusanById = ref(new Map())
const loading = ref(true)
const error = ref('')
const page = ref(1)
const search = ref('')
const filterState = reactive({ prodi: '', status: '' })

const toDelete = ref(null)
const deleting = ref(false)

useListState('guru', ['/admin/master-data/guru/'], {
  snapshot: () => ({ page: page.value, search: search.value, filter: { ...filterState } }),
  restore: (s) => {
    page.value = s.page
    search.value = s.search ?? ''
    Object.assign(filterState, s.filter ?? {})
  },
})

const ready = computed(() => !loading.value && !error.value)

const all = computed(() =>
  guru.value.map((g) => {
    const active = lokasi.value.filter((l) => l.guru?.id === g.id && l.status === 'active')
    const prodi = g.jurusan?.nama ?? jurusanById.value.get(g.jurusan_id) ?? '—'
    return {
      id: g.id,
      name: g.user?.name ?? '—',
      nip: g.nip,
      prodi,
      beban: active.length,
      kuota: g.kuota_bimbingan ?? null,
      perusahaan: new Set(active.map((l) => l.perusahaan?.id).filter(Boolean)).size,
      gelombang: active[0]?.gelombang ?? null,
      status: g.is_active === false ? 'nonaktif' : 'aktif',
    }
  })
)

const prodiOptions = computed(() => [...new Set(all.value.map((r) => r.prodi).filter((p) => p !== '—'))].sort())

const filters = computed(() => [
  { key: 'prodi', label: 'Program', icon: 'building', options: prodiOptions.value.map((p) => ({ value: p, label: p })) },
  {
    key: 'status',
    label: 'Status',
    icon: 'circle-check',
    options: [
      { value: 'aktif', label: 'Aktif' },
      { value: 'nonaktif', label: 'Nonaktif' },
    ],
  },
])

const stats = computed(() => {
  const total = all.value.length
  const aktif = all.value.filter((r) => r.beban > 0).length
  const siswa = all.value.reduce((n, r) => n + r.beban, 0)
  const gel = all.value.find((r) => r.gelombang)?.gelombang
  const gelLabel = gel ? [gel.nama, gel.tahun_ajaran].filter(Boolean).join(' · ') : ''
  const avg = total ? Math.round((siswa / total) * 10) / 10 : 0
  const r = ready.value
  return [
    { label: 'Total Guru', icon: 'user-check', tone: 'blue', value: r ? total : null, hint: 'guru pembimbing terdaftar' },
    { label: 'Aktif Membimbing', icon: 'user-check', tone: 'green', value: r ? aktif : null, hint: gelLabel || 'punya siswa aktif PKL' },
    { label: 'Rata-rata Bimbingan', icon: 'users', tone: 'blue', value: r ? avg : null, hint: 'siswa per guru' },
    { label: 'Belum Ada Siswa', icon: 'alert', tone: 'amber', value: r ? total - aktif : null, hint: 'perlu dialokasikan' },
  ]
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [g, l, j] = await Promise.all([
      fetchAllPages('/api/guru'),
      fetchAllPages('/api/lokasi-pkl'),
      fetchAllPages('/api/jurusan'),
    ])
    guru.value = g
    lokasi.value = l
    jurusanById.value = new Map(j.map((x) => [x.id, x.nama]))
  } catch (err) {
    guru.value = []
    error.value = getErrorMessage(err, 'Gagal memuat data guru.')
  } finally {
    loading.value = false
  }
}

async function confirmDelete() {
  const target = toDelete.value
  if (!target || deleting.value) return
  deleting.value = true
  try {
    const { data } = await api.delete(`/api/guru/${target.id}`)
    toast.show(data.message || 'Guru berhasil dihapus.')
    guru.value = guru.value.filter((g) => g.id !== target.id)
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

onMounted(load)
</script>
