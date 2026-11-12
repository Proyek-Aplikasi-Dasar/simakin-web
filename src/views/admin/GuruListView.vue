<template>
  <div class="p-8">
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
      <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Daftar Guru Pembimbing" description="Guru pembimbing PKL beserta beban bimbingannya." />

        <form class="flex flex-wrap items-center gap-3 px-6 py-4" @submit.prevent="applyFilters">
          <label
            class="flex h-10 min-w-[240px] flex-1 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-100 px-3 focus-within:ring-2 focus-within:ring-blue-200"
          >
            <AppIcon name="search" class="h-5 w-5 shrink-0 text-slate-400" />
            <input
              ref="searchInput"
              v-model="draftSearch"
              type="text"
              placeholder="Cari nama atau NIP…"
              class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <span class="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium leading-[14px] text-slate-500">
              Ctrl K
            </span>
          </label>

          <SelectDropdown
            v-model="draftProdi"
            class="w-[220px]"
            icon="building"
            placeholder="Semua Program"
            :options="prodiItems"
          />

          <SelectDropdown
            v-model="draftStatus"
            class="w-[220px]"
            icon="circle-check"
            placeholder="Semua Status"
            :options="statusItems"
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

        <p v-if="loading" class="px-6 py-12 text-center text-sm text-slate-400">Memuat data guru…</p>
        <div v-else-if="error" class="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p class="text-sm text-red-600">{{ error }}</p>
          <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">
            Coba lagi
          </button>
        </div>
        <p v-else-if="!pageRows.length" class="px-6 py-12 text-center text-sm text-slate-400">Tidak ada guru yang cocok.</p>

        <div v-else class="divide-y divide-slate-100">
          <div v-for="row in pageRows" :key="row.id" class="flex items-center gap-4 px-6 py-3">
            <div class="flex min-w-0 flex-1 items-center gap-2.5">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <AppIcon name="user" class="h-5 w-5" />
              </span>
              <div class="flex min-w-0 flex-col">
                <span class="truncate text-xs font-semibold leading-[18px] text-slate-900">{{ row.name }}</span>
                <span class="truncate text-[11px] leading-[14px] text-slate-500">NIP {{ row.nip }}</span>
              </div>
            </div>

            <span class="w-[170px] truncate text-xs leading-[18px] text-slate-600">{{ row.prodi }}</span>
            <span class="w-[120px] text-xs font-medium leading-[18px] text-slate-900">{{ row.beban }} siswa</span>
            <span class="w-[110px] text-xs leading-[18px] text-slate-600">
              {{ row.perusahaan ? `${row.perusahaan} mitra` : '—' }}
            </span>

            <div class="w-[150px]">
              <span :class="['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', STATUS[row.status].box]">
                <span :class="['h-1.5 w-1.5 rounded-full', STATUS[row.status].dot]" />
                {{ STATUS[row.status].label }}
              </span>
            </div>

            <div class="flex w-[148px] justify-end gap-2">
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
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 text-xs text-slate-600">
          <span>
            <template v-if="filtered.length">Menampilkan {{ from }}–{{ to }} dari {{ filtered.length }} guru</template>
            <template v-else>Tidak ada guru</template>
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
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import api, { getErrorMessage } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import { fetchAllPages } from '../../utils/siswa'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import SelectDropdown from '../../components/SelectDropdown.vue'
import { useListState } from '../../composables/useListState'

const toast = useToastStore()
const PAGE_SIZE = 10

const STATUS = {
  aktif: { label: 'Aktif', box: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-700' },
  kosong: { label: 'Belum Ada Siswa', box: 'border-yellow-200 bg-yellow-50 text-yellow-700', dot: 'bg-yellow-700' },
}

const columns = [
  { label: 'Guru', width: 'flex-1', align: '' },
  { label: 'Program Studi', width: 'w-[170px]', align: '' },
  { label: 'Beban Bimbingan', width: 'w-[120px]', align: '' },
  { label: 'Perusahaan', width: 'w-[110px]', align: '' },
  { label: 'Status', width: 'w-[150px]', align: '' },
  { label: 'Aksi', width: 'w-[148px]', align: 'text-right' },
]

const guru = ref([])
const lokasi = ref([])
const siswaProdi = ref(new Map()) 
const loading = ref(true)
const error = ref('')
const page = ref(1)

const draftSearch = ref('')
const draftProdi = ref('')
const draftStatus = ref('')
const applied = reactive({ search: '', prodi: '', status: '' })

const toDelete = ref(null)
const deleting = ref(false)
const searchInput = ref(null)

useListState('guru', ['/admin/master-data/guru/'], {
  snapshot: () => ({ page: page.value, applied: { ...applied } }),
  restore: (s) => {
    page.value = s.page
    Object.assign(applied, s.applied)
    draftSearch.value = s.applied.search
    draftProdi.value = s.applied.prodi
    draftStatus.value = s.applied.status
  },
})

const ready = computed(() => !loading.value && !error.value)

const all = computed(() =>
  guru.value.map((g) => {
    const active = lokasi.value.filter((l) => l.guru?.id === g.id && l.status === 'active')
    const count = {}
    active.forEach((l) => {
      const p = siswaProdi.value.get(l.siswa?.id)
      if (p) count[p] = (count[p] || 0) + 1
    })
    const prodi = Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    return {
      id: g.id,
      name: g.user?.name ?? '—',
      nip: g.nip,
      prodi,
      beban: active.length,
      perusahaan: new Set(active.map((l) => l.perusahaan?.id).filter(Boolean)).size,
      status: active.length ? 'aktif' : 'kosong',
    }
  })
)

const prodiOptions = computed(() => [...new Set(all.value.map((r) => r.prodi).filter((p) => p !== '—'))].sort())

const prodiItems = computed(() => [
  { value: '', label: 'Semua Program' },
  ...prodiOptions.value.map((p) => ({ value: p, label: p })),
])
const statusItems = [
  { value: '', label: 'Semua Status' },
  { value: 'aktif', label: 'Aktif Membimbing' },
  { value: 'kosong', label: 'Belum Ada Siswa' },
]

const stats = computed(() => {
  const total = all.value.length
  const aktif = all.value.filter((r) => r.status === 'aktif').length
  const siswa = all.value.reduce((n, r) => n + r.beban, 0)
  const avg = total ? Math.round((siswa / total) * 10) / 10 : 0
  const r = ready.value
  return [
    { label: 'Total Guru', icon: 'user-check', tone: 'blue', value: r ? total : null, hint: 'guru pembimbing terdaftar' },
    { label: 'Aktif Membimbing', icon: 'user-check', tone: 'green', value: r ? aktif : null, hint: 'punya siswa aktif PKL' },
    { label: 'Rata-rata Bimbingan', icon: 'users', tone: 'blue', value: r ? avg : null, hint: 'siswa per guru' },
    { label: 'Belum Ada Siswa', icon: 'alert', tone: 'amber', value: r ? total - aktif : null, hint: 'perlu dialokasikan' },
  ]
})

const filtered = computed(() => {
  const q = applied.search.toLowerCase()
  return all.value.filter(
    (r) =>
      (!applied.prodi || r.prodi === applied.prodi) &&
      (!applied.status || r.status === applied.status) &&
      (!q || r.name.toLowerCase().includes(q) || String(r.nip).toLowerCase().includes(q))
  )
})

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

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [g, l, s] = await Promise.all([
      fetchAllPages('/api/guru'),
      fetchAllPages('/api/lokasi-pkl'),
      fetchAllPages('/api/siswa'),
    ])
    guru.value = g
    lokasi.value = l
    siswaProdi.value = new Map(s.map((x) => [x.id, x.jurusan?.nama || x.jurusan?.kode || null]))
  } catch (err) {
    guru.value = []
    error.value = getErrorMessage(err, 'Gagal memuat data guru.')
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  applied.search = draftSearch.value.trim()
  applied.prodi = draftProdi.value
  applied.status = draftStatus.value
  page.value = 1
}

function goTo(p) {
  if (p < 1 || p > lastPage.value || p === page.value) return
  page.value = p
}

async function confirmDelete() {
  const target = toDelete.value
  if (!target || deleting.value) return
  deleting.value = true
  try {
    const { data } = await api.delete(`/api/guru/${target.id}`)
    toast.show(data.message || 'Guru berhasil dihapus.')
    guru.value = guru.value.filter((g) => g.id !== target.id)
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

function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  load()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>