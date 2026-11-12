<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Monitoring' }, { label: 'Jurnal Harian' }]"
      title="Jurnal Harian"
      subtitle="Pantau dan koreksi jurnal kegiatan harian seluruh siswa."
    >
      <button
        type="button"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
        @click="exportExcel"
      >
        <AppIcon name="file-text" class="h-5 w-5" />
        Export Excel
      </button>
      <router-link
        to="/admin/jurnal-harian/tambah"
        class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold leading-5 text-white hover:bg-blue-700"
      >
        <AppIcon name="calendar-check" class="h-5 w-5" />
        Tambah Jurnal
      </router-link>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Daftar Jurnal Harian Siswa" description="Jurnal harian dari aplikasi siswa." />

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
            v-model="draft.pembimbing"
            class="w-[220px]"
            icon="user-check"
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

        <p v-if="!pageRows.length" class="px-6 py-12 text-center text-sm text-slate-400">Belum ada data jurnal.</p>

        <div v-else class="divide-y divide-slate-100">
          <div v-for="row in pageRows" :key="row.siswaId" class="flex items-center gap-4 px-6 py-3">
            <div class="flex min-w-0 flex-1 items-center gap-2.5">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <AppIcon name="user" class="h-5 w-5" />
              </span>
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold leading-[18px] text-slate-900">{{ row.nama }}</p>
                <p class="truncate text-[11px] leading-[14px] text-slate-500">{{ row.kelas }} · {{ row.jam || '—' }}</p>
              </div>
            </div>

            <span class="w-[160px] truncate text-xs text-slate-600">{{ row.pembimbing }}</span>

            <div class="w-[260px] min-w-0">
              <p class="truncate text-xs font-semibold leading-[18px] text-slate-900">{{ row.kompetensi || '—' }}</p>
              <p class="truncate text-[11px] leading-[14px] text-slate-500">{{ row.deskripsi || 'Siswa belum mengirim jurnal' }}</p>
            </div>

            <div class="w-[140px]">
              <span :class="['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', JURNAL_STATUS[row.status].box]">
                <span :class="['h-1.5 w-1.5 rounded-full', JURNAL_STATUS[row.status].dot]" />
                {{ JURNAL_STATUS[row.status].label }}
              </span>
            </div>

            <div class="flex w-[90px] justify-end gap-2">
              <router-link
                :to="detailLink(row)"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Lihat jurnal"
              >
                <AppIcon name="eye" class="h-5 w-5" />
              </router-link>
              <router-link
                :to="editLink(row)"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Edit jurnal"
              >
                <AppIcon name="pencil" class="h-5 w-5" />
              </router-link>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 text-xs text-slate-600">
          <span>
            <template v-if="filtered.length">Menampilkan {{ from }}–{{ to }} dari {{ filtered.length }} jurnal</template>
            <template v-else>Tidak ada jurnal</template>
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
import { toIso } from '../../utils/siswa'
import { JURNAL_STATUS } from '../../utils/jurnal'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'
import SelectDropdown from '../../components/SelectDropdown.vue'
import { useListState } from '../../composables/useListState'

const PAGE_SIZE = 5

const columns = [
  { label: 'Siswa', width: 'flex-1', align: '' },
  { label: 'Pembimbing', width: 'w-[160px]', align: '' },
  { label: 'Kegiatan', width: 'w-[260px]', align: '' },
  { label: 'Status', width: 'w-[140px]', align: '' },
  { label: 'Aksi', width: 'w-[90px]', align: 'text-right' },
]

const rows = ref([])
const ringkasan = ref({})
const pembimbingOptions = ref([])
const pembimbingItems = computed(() => [
  { value: '', label: 'Semua Pembimbing' },
  ...pembimbingOptions.value.map((p) => ({ value: p, label: p })),
])

const page = ref(1)
const tab = ref('semua')
const searchInput = ref(null)

const draft = reactive({ search: '', tanggal: toIso(new Date()), pembimbing: '' })
const applied = reactive({ ...draft })

useListState('jurnal-harian', ['/admin/jurnal-harian/'], {
  snapshot: () => ({ page: page.value, tab: tab.value, applied: { ...applied } }),
  restore: (s) => {
    page.value = s.page
    tab.value = s.tab
    Object.assign(applied, s.applied)
    Object.assign(draft, s.applied)
  },
})

function applyFilters() {
  Object.assign(applied, draft)
  page.value = 1
}

function exportExcel() {
}

const val = (v) => v ?? '—'

const stats = computed(() => [
  { label: 'Jurnal Masuk', value: val(ringkasan.value.masuk), hint: 'hari ini', icon: 'hourglass', tone: 'amber' },
  { label: 'Total Bulan Ini', value: val(ringkasan.value.bulan), hint: 'bulan ini', icon: 'user-check', tone: 'green' },
  { label: 'Dikoreksi Admin', value: val(ringkasan.value.dikoreksi), hint: 'bulan ini', icon: 'alert', tone: 'red' },
  { label: 'Belum Mengisi', value: val(ringkasan.value.belum), hint: 'siswa hari ini', icon: 'file', tone: 'blue' },
])

const base = computed(() => {
  const q = applied.search.toLowerCase()
  return rows.value.filter(
    (r) =>
      (!q || `${r.nama} ${r.nis}`.toLowerCase().includes(q)) &&
      (!applied.pembimbing || r.pembimbing === applied.pembimbing)
  )
})

const tabs = computed(() => [
  { key: 'semua', label: 'Semua', count: ringkasan.value.totalSemua ?? base.value.length },
  { key: 'belum', label: 'Belum Mengisi', count: ringkasan.value.belum ?? base.value.filter((r) => r.status === 'belum').length },
])

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

const detailLink = (r) =>
  r.jurnalId
    ? `/admin/jurnal-harian/${r.jurnalId}`
    : `/admin/jurnal-harian/belum/${r.siswaId}?tanggal=${applied.tanggal}`

const editLink = (r) =>
  r.jurnalId
    ? `/admin/jurnal-harian/${r.jurnalId}/edit`
    : `/admin/jurnal-harian/tambah?siswa_id=${r.siswaId}&tanggal=${applied.tanggal}`

watch(tab, () => (page.value = 1))

function onKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>