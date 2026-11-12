<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'PKL' }, { label: 'Pengajuan PKL' }]"
      title="Pengajuan PKL"
      subtitle="Siswa memilih tempat PKL dari daftar perusahaan yang dibuka admin."
    >
      <button
        type="button"
        disabled
        title="Menunggu endpoint BE"
        class="flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold leading-5 opacity-60"
      >
        <AppIcon name="file-text" class="h-5 w-5" />
        Export Excel
      </button>

      <router-link
        to="/admin/data-master/perusahaan/tambah"
        class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold leading-5 text-white hover:bg-blue-700"
      >
        <AppIcon name="plus" class="h-5 w-5" />
        Tambah Perusahaan
      </router-link>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Daftar Pengajuan" description="Status pengajuan tempat PKL siswa." />

        <div class="flex gap-8 overflow-x-auto border-b border-slate-200 px-6">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            :class="[
              'flex items-center gap-2 whitespace-nowrap border-b-2 py-3 text-sm font-semibold',
              tab.key === activeTab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900',
            ]"
            @click="selectTab(tab.key)"
          >
            {{ tab.label }}
            <span
              v-if="counts[tab.key] != null"
              :class="[
                'rounded-full px-2 py-0.5 text-[11px]',
                tab.key === activeTab ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600',
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
            v-model="draftPerusahaan"
            class="w-[220px]"
            icon="building"
            placeholder="Semua Perusahaan"
            :options="perusahaanItems"
          />

          <label
            class="flex h-10 w-[200px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 focus-within:ring-2 focus-within:ring-blue-200"
          >
            <AppIcon name="calendar" class="h-4 w-4 shrink-0 text-slate-400" />
            <input v-model="draftBulan" type="month" class="min-w-0 flex-1 bg-transparent outline-none" />
          </label>

          <button
            type="submit"
            class="flex h-10 items-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-600 hover:bg-blue-100"
          >
            <AppIcon name="filter" class="h-5 w-5" />
            Terapkan
          </button>
        </form>

        <div
          v-if="selected.length"
          class="flex items-center gap-4 border-t border-slate-100 bg-blue-50 px-6 py-2.5"
        >
          <input
            type="checkbox"
            checked
            class="h-5 w-5 shrink-0 cursor-pointer rounded-md accent-blue-600"
            aria-label="Batal pilih semua"
            @change="clearSelection"
          />
          <span class="flex-1 text-sm font-semibold text-blue-600">{{ selected.length }} pengajuan dipilih</span>
          <button
            type="button"
            :disabled="bulkLoading"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
            @click="clearSelection"
          >
            Batal Pilih
          </button>
          <button
            type="button"
            :disabled="bulkLoading"
            class="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            @click="approveSelected"
          >
            {{ bulkLoading ? 'Memproses...' : 'Setujui Terpilih' }}
          </button>
        </div>

        <div v-else class="flex items-center gap-4 border-t border-slate-100 bg-slate-100 px-6 py-2.5">
          <input
            type="checkbox"
            :checked="allPageSelected"
            :disabled="!selectableOnPage.length"
            class="h-5 w-5 shrink-0 cursor-pointer rounded-md accent-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Pilih semua pengajuan menunggu di halaman ini"
            @change="toggleAllOnPage"
          />
          <span class="flex-[2] text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Siswa</span>
          <span class="flex-[1.6] text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Perusahaan Tujuan</span>
          <span class="flex-1 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Diajukan</span>
          <span class="flex-1 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Status</span>
          <span class="w-[120px] text-right text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Aksi</span>
        </div>

        <p v-if="loading" class="px-6 py-12 text-center text-sm text-slate-400">Memuat data pengajuan…</p>
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
        <p v-else-if="!filteredRows.length" class="px-6 py-12 text-center text-sm text-slate-400">
          {{ rows.length ? 'Tidak ada pengajuan yang cocok.' : 'Belum ada pengajuan PKL.' }}
        </p>

        <ul v-else>
          <li
            v-for="row in pagedRows"
            :key="row.id"
            :class="[
              'flex items-center gap-4 border-t border-slate-100 px-6 py-4 first:border-t-0',
              isSelected(row.id) && 'bg-blue-50/60',
            ]"
          >
            <input
              v-if="row.status === 'pending'"
              type="checkbox"
              :checked="isSelected(row.id)"
              class="h-5 w-5 shrink-0 cursor-pointer rounded-md accent-blue-600"
              :aria-label="`Pilih pengajuan ${row.siswa.nama}`"
              @change="toggleRow(row.id)"
            />
            <span v-else class="h-5 w-5 shrink-0"></span>

            <div class="flex min-w-0 flex-[2] items-center gap-3">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <AppIcon name="user" class="h-5 w-5" />
              </span>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold leading-5 text-slate-900">{{ row.siswa.nama }}</p>
                <p class="truncate text-xs leading-4 text-slate-500">{{ row.siswa.sub }}</p>
              </div>
            </div>

            <div class="min-w-0 flex-[1.6]">
              <p class="truncate text-sm font-semibold leading-5 text-slate-900">{{ row.perusahaan.nama }}</p>
              <p class="truncate text-xs leading-4 text-slate-500">{{ row.perusahaan.alamat }}</p>
            </div>

            <p class="flex-1 text-sm text-slate-600">{{ row.diajukan }}</p>

            <div class="flex-1">
              <span
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-[14px]',
                  PENGAJUAN_STATUS[row.status].box,
                ]"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                {{ PENGAJUAN_STATUS[row.status].label }}
              </span>
            </div>

            <div class="flex w-[120px] justify-end">
              <router-link
                v-if="row.status === 'pending'"
                :to="`/admin/pengajuan-pkl/${row.id}`"
                class="flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <AppIcon name="circle-check" class="h-4 w-4" />
                Verifikasi
              </router-link>
              <router-link
                v-else
                :to="`/admin/pengajuan-pkl/${row.id}`"
                class="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-900 hover:bg-slate-50"
              >
                <AppIcon name="eye" class="h-4 w-4" />
                Detail
              </router-link>
            </div>
          </li>
        </ul>

        <div class="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 text-xs text-slate-600">
          <span>{{ summary }}</span>

          <div v-if="totalPages > 1" class="flex items-center gap-1.5">
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"
              :disabled="page === 1"
              aria-label="Halaman sebelumnya"
              @click="page--"
            >
              <AppIcon name="arrow-left" class="h-4 w-4" />
            </button>

            <template v-for="(p, i) in pageNumbers" :key="i">
              <span v-if="p === '…'" class="flex h-8 w-8 items-center justify-center">…</span>
              <button
                v-else
                type="button"
                :class="[
                  'h-8 min-w-8 rounded-lg px-2 text-xs font-semibold',
                  p === page ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
                ]"
                @click="page = p"
              >
                {{ p }}
              </button>
            </template>

            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"
              :disabled="page === totalPages"
              aria-label="Halaman berikutnya"
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
import api, { getErrorMessage } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import { fetchAllPages } from '../../utils/siswa'
import { PENGAJUAN_STATUS, formatTanggal, monthKey, monthLabel } from '../../utils/pengajuan'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'
import SelectDropdown from '../../components/SelectDropdown.vue'
import { useListState } from '../../composables/useListState'

const toast = useToastStore()
const PAGE_SIZE = 10

const tabs = [
  { key: 'semua', label: 'Semua' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'approved', label: 'Diterima' },
  { key: 'rejected', label: 'Ditolak' },
]
const activeTab = ref('semua')

const rows = ref([])
const perusahaanList = ref([])
const perusahaanLoaded = ref(false)
const loading = ref(true)
const error = ref('')
const page = ref(1)

const searchInput = ref(null)
const draftSearch = ref('')
const draftPerusahaan = ref('')
const draftBulan = ref('')
const applied = reactive({ search: '', perusahaan: '', bulan: '' })

useListState('pengajuan-pkl', ['/admin/pengajuan-pkl/'], {
  snapshot: () => ({ page: page.value, tab: activeTab.value, applied: { ...applied } }),
  restore: (s) => {
    page.value = s.page
    activeTab.value = s.tab
    Object.assign(applied, s.applied)
    draftSearch.value = s.applied.search
    draftPerusahaan.value = s.applied.perusahaan
    draftBulan.value = s.applied.bulan
  },
})

const selected = ref([])
const bulkLoading = ref(false)

function normalize(p, alamatById) {
  const jurusan = p.siswa?.jurusan?.kode || p.siswa?.jurusan?.nama
  return {
    id: p.id,
    status: p.status,
    siswa: {
      nama: p.siswa?.nama || '—',
      sub: [p.siswa?.nis ? `NIS ${p.siswa.nis}` : null, jurusan].filter(Boolean).join(' · ') || '—',
      nis: p.siswa?.nis || '',
    },
    perusahaan: {
      id: p.perusahaan?.id ?? null,
      nama: p.perusahaan?.nama || '—',
      alamat: alamatById.get(p.perusahaan?.id) || '—',
    },
    diajukan: formatTanggal(p.created_at),
    bulan: monthKey(p.created_at),
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [pengajuanRes, perusahaanRes] = await Promise.allSettled([
      fetchAllPages('/api/pengajuan-pkl'),
      fetchAllPages('/api/perusahaan'),
    ])
    if (pengajuanRes.status === 'rejected') throw pengajuanRes.reason

    perusahaanLoaded.value = perusahaanRes.status === 'fulfilled'
    perusahaanList.value = perusahaanLoaded.value ? perusahaanRes.value : []

    const alamatById = new Map(perusahaanList.value.map((p) => [p.id, p.alamat]))
    rows.value = pengajuanRes.value.map((p) => normalize(p, alamatById))

    const pendingIds = new Set(rows.value.filter((r) => r.status === 'pending').map((r) => r.id))
    selected.value = selected.value.filter((id) => pendingIds.has(id))
  } catch (err) {
    rows.value = []
    error.value = getErrorMessage(err, 'Gagal memuat data pengajuan.')
  } finally {
    loading.value = false
  }
}

const ready = computed(() => !loading.value && !error.value)

const counts = computed(() => {
  if (!ready.value) return { semua: null, pending: null, approved: null, rejected: null }
  const c = { semua: rows.value.length, pending: 0, approved: 0, rejected: 0 }
  rows.value.forEach((r) => {
    if (r.status in c) c[r.status]++
  })
  return c
})

const stats = computed(() => [
  { label: 'Menunggu Verifikasi', icon: 'hourglass', tone: 'amber', value: counts.value.pending, hint: 'perlu ditinjau admin' },
  { label: 'Diterima', icon: 'circle-check', tone: 'green', value: counts.value.approved, hint: 'langsung jadi penempatan' },
  { label: 'Ditolak', icon: 'circle-x', tone: 'red', value: counts.value.rejected, hint: 'siswa memilih ulang' },
  {
    label: 'Perusahaan Dibuka',
    icon: 'building',
    tone: 'blue',
    value: perusahaanLoaded.value && ready.value ? perusahaanList.value.length : null,
    hint: 'bisa dipilih siswa',
  },
])

const perusahaanOptions = computed(() =>
  [...perusahaanList.value].sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
)
const perusahaanItems = computed(() => [
  { value: '', label: 'Semua Perusahaan' },
  ...perusahaanOptions.value.map((p) => ({ value: String(p.id), label: p.nama })),
])
const bulanOptions = computed(() => {
  const keys = [...new Set(rows.value.map((r) => r.bulan).filter(Boolean))].sort().reverse()
  return keys.map((key) => ({ key, label: monthLabel(key) }))
})

const filteredRows = computed(() => {
  const q = applied.search.toLowerCase()
  return rows.value.filter((r) => {
    if (activeTab.value !== 'semua' && r.status !== activeTab.value) return false
    if (applied.perusahaan && String(r.perusahaan.id) !== applied.perusahaan) return false
    if (applied.bulan && r.bulan !== applied.bulan) return false
    if (q && !`${r.siswa.nama} ${r.siswa.nis}`.toLowerCase().includes(q)) return false
    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / PAGE_SIZE)))

const pagedRows = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filteredRows.value.slice(start, start + PAGE_SIZE)
})

const summary = computed(() => {
  const total = filteredRows.value.length
  if (total === 0) return 'Tidak ada pengajuan'
  const start = (page.value - 1) * PAGE_SIZE + 1
  const end = Math.min(page.value * PAGE_SIZE, total)
  return `Menampilkan ${start}–${end} dari ${total} pengajuan`
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)

  const wanted = [1, total, page.value - 1, page.value, page.value + 1]
  const list = [...new Set(wanted)].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)

  const result = []
  list.forEach((n, i) => {
    if (i > 0 && n - list[i - 1] > 1) result.push('…')
    result.push(n)
  })
  return result
})

watch(totalPages, (last) => {
  if (page.value > last) page.value = last
})

function applyFilters() {
  applied.search = draftSearch.value.trim()
  applied.perusahaan = draftPerusahaan.value
  applied.bulan = draftBulan.value
  page.value = 1
  clearSelection()
}

function selectTab(key) {
  if (key === activeTab.value) return
  activeTab.value = key
  page.value = 1
  clearSelection()
}

const selectableOnPage = computed(() => pagedRows.value.filter((r) => r.status === 'pending'))
const allPageSelected = computed(
  () => selectableOnPage.value.length > 0 && selectableOnPage.value.every((r) => selected.value.includes(r.id))
)

const isSelected = (id) => selected.value.includes(id)

function toggleRow(id) {
  selected.value = isSelected(id) ? selected.value.filter((x) => x !== id) : [...selected.value, id]
}

function toggleAllOnPage() {
  const ids = selectableOnPage.value.map((r) => r.id)
  selected.value = allPageSelected.value
    ? selected.value.filter((id) => !ids.includes(id))
    : [...new Set([...selected.value, ...ids])]
}

function clearSelection() {
  selected.value = []
}

async function approveSelected() {
  if (bulkLoading.value || !selected.value.length) return
  bulkLoading.value = true
  try {
    const { data } = await api.put('/api/pengajuan-pkl/bulk-approve', { ids: selected.value })
    const approved = data.approved?.length ?? 0
    const failed = data.failed ?? []

    if (failed.length) {
      const detail = failed[0]?.error ? `: ${failed[0].error}` : ''
      toast.show(
        `${approved} pengajuan disetujui, ${failed.length} gagal${detail}`,
        approved ? 'success' : 'error'
      )
    } else {
      toast.show(`${approved} pengajuan disetujui.`)
    }

    clearSelection()
    await load()
  } catch (err) {
    const status = err.response?.status
    if (status && status < 500 && ![401, 403, 419, 429].includes(status)) {
      toast.show(getErrorMessage(err), 'error')
    }
  } finally {
    bulkLoading.value = false
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