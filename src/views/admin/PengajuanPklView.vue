<template>
  <div class="p-4 sm:p-6 lg:p-8">
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
      <section class="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" :loading="loading" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Daftar Pengajuan" description="Status pengajuan tempat PKL siswa." />

        <div class="flex gap-6 overflow-x-auto border-b border-slate-200 px-4 sm:gap-8 sm:px-6">
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
            <span v-else-if="loading" class="h-5 w-7 animate-pulse rounded-full bg-slate-200" aria-hidden="true"></span>
          </button>
        </div>

        <form class="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6" @submit.prevent="applyFilters">
          <label
            class="flex h-10 w-full min-w-0 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-100 px-3 focus-within:ring-2 focus-within:ring-blue-200 sm:min-w-[240px] sm:flex-1"
          >
            <AppIcon name="search" class="h-5 w-5 shrink-0 text-slate-400" />
            <input
              ref="searchInput"
              v-model="draftSearch"
              type="text"
              placeholder="Cari nama / NIS siswa…"
              class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <span class="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium leading-[14px] text-slate-500 md:block">
              Ctrl K
            </span>
          </label>

          <SelectDropdown
            v-model="draftPerusahaan"
            class="w-full sm:w-[220px]"
            icon="building"
            placeholder="Semua Perusahaan"
            :options="perusahaanItems"
          />

          <label
            class="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 focus-within:ring-2 focus-within:ring-blue-200 sm:w-[200px]"
          >
            <AppIcon name="calendar" class="h-4 w-4 shrink-0 text-slate-400" />
            <DatePicker v-model="draftBulan" mode="month" bare class="min-w-0 flex-1" />
          </label>

          <button
            type="submit"
            class="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-600 hover:bg-blue-100 sm:w-auto"
          >
            <AppIcon name="filter" class="h-5 w-5" />
            Terapkan
          </button>
        </form>

        <!-- HP (< sm): tiap baris jadi kartu. sm ke atas: tabel digeser horizontal kalau layar sempit -->
        <div class="sm:overflow-x-auto">
        <div class="sm:min-w-[760px]">
        <div
          v-if="selected.length"
          class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 bg-blue-50 px-4 py-2.5 sm:px-6"
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
            @click="showBulkDialog = true"
          >
            {{ bulkLoading ? 'Memproses...' : 'Setujui Terpilih' }}
          </button>
        </div>

        <div v-else class="relative flex items-center gap-4 border-t border-slate-100 bg-slate-100 px-4 py-2.5 sm:px-6">
          <input
            ref="checkAll"
            type="checkbox"
            :checked="allPageSelected"
            :class="{ 'hint-shake': shake }"
            class="h-5 w-5 shrink-0 cursor-pointer rounded-md accent-blue-600"
            aria-label="Pilih semua pengajuan menunggu di halaman ini"
            title="Hanya memilih pengajuan berstatus Menunggu"
            @change="toggleAllOnPage"
          />

          <!-- Di-teleport ke body + posisi fixed supaya tidak terpotong overflow-hidden/overflow-x-auto kartu -->
          <Teleport to="body">
          <div v-if="showHint" class="fixed inset-0 z-[60]" @click="hideHint"></div>
          <Transition name="hint">
            <div
              v-if="showHint"
              role="status"
              :style="{ left: hintPos.left + 'px', top: hintPos.top + 'px' }"
              class="fixed z-[70] w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border border-yellow-200 bg-white p-3.5 shadow-lg"
            >
              <span class="absolute -top-1.5 h-3 w-3 rotate-45 border-l border-t border-yellow-200 bg-white" :style="{ left: hintPos.arrow + 'px' }"></span>
              <div class="flex items-start gap-3">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700">
                  <AppIcon name="hourglass" class="h-[18px] w-[18px]" />
                </span>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold leading-[18px] text-slate-900">Belum ada yang bisa dipilih</p>
                  <p class="mt-0.5 text-[11px] leading-4 text-slate-500">
                    Pilih semua hanya untuk pengajuan berstatus <b class="font-semibold text-yellow-700">Menunggu</b>, dan
                    halaman ini tidak punya satu pun.
                  </p>
                  <div class="mt-2.5 flex items-center gap-2">
                    <button
                      v-if="activeTab !== 'pending' && counts.pending"
                      type="button"
                      class="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold leading-4 text-white hover:bg-blue-700"
                      @click="showPending"
                    >
                      Lihat {{ counts.pending }} yang menunggu
                    </button>
                    <button
                      type="button"
                      class="rounded-lg px-2 py-1.5 text-[11px] font-semibold leading-4 text-slate-500 hover:bg-slate-100"
                      @click="hideHint"
                    >
                      Mengerti
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
          </Teleport>
          <span class="text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500 sm:hidden">Pilih semua</span>
          <span class="flex-[2] text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500 max-sm:hidden">Siswa</span>
          <span class="flex-[1.6] text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500 max-sm:hidden">Perusahaan Tujuan</span>
          <span class="flex-1 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500 max-sm:hidden">Diajukan</span>
          <span class="flex-1 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500 max-sm:hidden">Status</span>
          <span class="w-[128px] text-right text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500 max-sm:hidden">Aksi</span>
        </div>

        <ul v-if="loading" role="status" aria-busy="true" aria-label="Memuat data pengajuan">
          <li
            v-for="i in 6"
            :key="i"
            class="flex items-center gap-4 border-t border-slate-100 px-4 py-3 first:border-t-0 sm:px-6 max-sm:[&>*:nth-child(n+3)]:hidden"
          >
            <span class="h-5 w-5 shrink-0 animate-pulse rounded-md bg-slate-200"></span>

            <div class="flex min-w-0 flex-[2] items-center gap-3">
              <span class="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200"></span>
              <div class="flex flex-col gap-1.5">
                <span :class="['h-3 animate-pulse rounded bg-slate-200', i % 2 ? 'w-32' : 'w-40']"></span>
                <span class="h-2.5 w-24 animate-pulse rounded bg-slate-100"></span>
              </div>
            </div>

            <div class="flex min-w-0 flex-[1.6] flex-col gap-1.5">
              <span class="h-3 w-36 max-w-full animate-pulse rounded bg-slate-200"></span>
              <span class="h-2.5 w-44 max-w-full animate-pulse rounded bg-slate-100"></span>
            </div>

            <div class="flex-1">
              <span class="block h-3 w-20 animate-pulse rounded bg-slate-200"></span>
            </div>

            <div class="flex-1">
              <span class="block h-6 w-24 animate-pulse rounded-full bg-slate-100"></span>
            </div>

            <div class="flex w-[128px] justify-end">
              <span class="h-8 w-24 animate-pulse rounded-xl bg-slate-100"></span>
            </div>
          </li>
        </ul>
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
              'flex items-center gap-4 border-t border-slate-100 px-4 py-3 first:border-t-0 sm:px-6',
              'max-sm:grid max-sm:grid-cols-[auto_1fr] max-sm:gap-x-3 max-sm:gap-y-0 max-sm:border-t-8 max-sm:py-3 max-sm:first:border-t-0',
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
            <span v-else class="h-5 w-5 shrink-0 max-sm:hidden"></span>

            <div
              :class="['flex min-w-0 flex-[2] items-center gap-3 max-sm:pb-3', row.status !== 'pending' && 'max-sm:col-span-2']"
            >
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <AppIcon name="user" class="h-5 w-5" />
              </span>
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold leading-[18px] text-slate-900">{{ row.siswa.nama }}</p>
                <p class="truncate text-[11px] leading-[14px] text-slate-500">{{ row.siswa.sub }}</p>
              </div>
            </div>

            <div class="min-w-0 flex-[1.6]" data-label="Perusahaan Tujuan" :class="mobileCell">
              <p class="truncate text-xs font-medium leading-[18px] text-slate-900">{{ row.perusahaan.nama }}</p>
              <p class="truncate text-[11px] leading-[14px] text-slate-500">{{ row.perusahaan.alamat }}</p>
            </div>

            <p class="flex-1 text-xs leading-[18px] text-slate-600" data-label="Diajukan" :class="mobileCell">{{ row.diajukan }}</p>

            <div class="flex-1 max-sm:items-start" data-label="Status" :class="mobileCell">
              <span
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4',
                  PENGAJUAN_STATUS[row.status].box,
                ]"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                {{ PENGAJUAN_STATUS[row.status].label }}
              </span>
            </div>

            <div class="flex w-[128px] justify-end max-sm:col-span-2 max-sm:w-full max-sm:border-t max-sm:border-slate-200 max-sm:pb-2 max-sm:pt-3.5">
              <router-link
                v-if="row.status === 'pending'"
                :to="`/admin/pengajuan-pkl/${row.id}`"
                class="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold leading-4 text-white hover:bg-blue-700"
              >
                <AppIcon name="circle-check" class="h-4 w-4" />
                Verifikasi
              </router-link>
              <router-link
                v-else
                :to="`/admin/pengajuan-pkl/${row.id}`"
                class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold leading-4 text-slate-900 hover:bg-slate-50"
              >
                <AppIcon name="eye" class="h-4 w-4" />
                Detail
              </router-link>
            </div>
          </li>
        </ul>
        </div>
        </div>

        <div v-if="ready" class="flex flex-col items-start justify-between gap-3 border-t border-slate-100 px-4 py-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
          <span>{{ summary }}</span>

          <div class="flex items-center gap-1.5">
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
                  p === page ? 'bg-blue-600 text-white' : 'border border-slate-100 bg-white text-slate-600 hover:bg-slate-50',
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
        <div v-else-if="loading" class="flex h-[57px] items-center border-t border-slate-100 px-6">
          <span class="h-3 w-44 animate-pulse rounded bg-slate-100"></span>
        </div>
      </section>
    </div>

    <BulkApproveDialog
      :show="showBulkDialog"
      :count="selected.length"
      :loading="bulkLoading"
      @cancel="showBulkDialog = false"
      @confirm="approveSelected"
    />
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
import DatePicker from '../../components/DatePicker.vue'
import SelectDropdown from '../../components/SelectDropdown.vue'
import BulkApproveDialog from '../../components/BulkApproveDialog.vue'
import { useListState } from '../../composables/useListState'

const toast = useToastStore()
const PAGE_SIZE = 10

// Sel berlabel di kartu HP (< sm): label kolom (data-label) di atas, nilai di bawah
const mobileCell =
  'max-sm:col-span-2 max-sm:flex max-sm:flex-col max-sm:gap-1.5 max-sm:border-t max-sm:border-slate-200 max-sm:py-3 max-sm:before:text-[10px] max-sm:before:font-semibold max-sm:before:uppercase max-sm:before:tracking-[0.6px] max-sm:before:text-slate-500 max-sm:before:content-[attr(data-label)]'

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
const showBulkDialog = ref(false)

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
    value: perusahaanLoaded.value && ready.value ? perusahaanList.value.filter((p) => p.is_active !== false).length : null,
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

function toggleAllOnPage(e) {
  const ids = selectableOnPage.value.map((r) => r.id)
  if (!ids.length) {
    if (e?.target) e.target.checked = false
    showEmptyHint()
    return
  }
  selected.value = allPageSelected.value
    ? selected.value.filter((id) => !ids.includes(id))
    : [...new Set([...selected.value, ...ids])]
}

function clearSelection() {
  selected.value = []
  hideHint()
}

const showHint = ref(false)
const shake = ref(false)
const checkAll = ref(null)
const hintPos = reactive({ left: 16, top: 0, arrow: 18 })
let hintTimer = null

function placeHint() {
  const el = checkAll.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const width = Math.min(320, window.innerWidth - 32)
  const left = Math.max(16, Math.min(r.left - 4, window.innerWidth - width - 16))
  hintPos.left = left
  hintPos.top = r.bottom + 14
  hintPos.arrow = Math.max(12, r.left + r.width / 2 - left - 6)
}

function hideHint() {
  showHint.value = false
  clearTimeout(hintTimer)
}

function showEmptyHint() {
  clearTimeout(hintTimer)
  placeHint()
  showHint.value = true
  shake.value = true
  setTimeout(() => (shake.value = false), 450)
  hintTimer = setTimeout(hideHint, 6000)
}

function showPending() {
  hideHint()
  selectTab('pending')
}

async function approveSelected(guruId = null) {
  if (bulkLoading.value || !selected.value.length) return
  bulkLoading.value = true
  try {
    const payload = { ids: selected.value }
    if (guruId) payload.guru_pembimbing_id = guruId
    const { data } = await api.put('/api/pengajuan-pkl/bulk-approve', payload)
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

    showBulkDialog.value = false
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
  if (e.key === 'Escape') hideHint()
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', hideHint)
  window.addEventListener('scroll', hideHint, true)
  load()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', hideHint)
  window.removeEventListener('scroll', hideHint, true)
  clearTimeout(hintTimer)
})
</script>

<style scoped>
.hint-enter-active {
  transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.hint-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.hint-enter-from,
.hint-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}
.hint-shake {
  animation: hint-shake 0.45s ease;
}
@keyframes hint-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-3px);
  }
  40% {
    transform: translateX(3px);
  }
  60% {
    transform: translateX(-2px);
  }
  80% {
    transform: translateX(2px);
  }
}
</style>