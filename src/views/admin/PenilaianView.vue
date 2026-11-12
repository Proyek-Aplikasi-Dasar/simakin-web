<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Monitoring' }, { label: 'Penilaian' }]"
      title="Penilaian"
      subtitle="Penilaian bulanan diisi pembimbing industri lewat HP siswa. Nilai akhir diinput guru pembimbing."
    >
      <button
        type="button"
        disabled
        title="Menunggu endpoint BE"
        class="flex h-[42px] cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold leading-5 text-slate-900 opacity-60"
      >
        <AppIcon name="file-text" class="h-5 w-5 text-slate-600" />
        Export Nilai
      </button>
      <button
        type="button"
        disabled
        title="Menunggu endpoint BE"
        class="flex h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold leading-5 text-white opacity-60"
      >
        <AppIcon name="calendar-plus" class="h-5 w-5" />
        Atur Periode
      </button>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Status Penilaian Siswa" description="Progres penilaian bulanan dan nilai akhir.">
        </CardHeader>

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
            <input v-model="draft.periode" type="month" class="min-w-0 flex-1 bg-transparent outline-none" />
          </label>

          <SelectDropdown
            v-model="draft.program"
            class="w-[220px]"
            icon="building"
            placeholder="Semua Program Studi"
            :options="programItems"
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

        <p v-if="loading" class="px-6 py-12 text-center text-sm text-slate-400">Memuat data penilaian…</p>
        <div v-else-if="error" class="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p class="text-sm text-red-600">{{ error }}</p>
          <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">Coba lagi</button>
        </div>
        <p v-else-if="!pageRows.length" class="px-6 py-12 text-center text-sm text-slate-400">Belum ada data penilaian.</p>

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

            <span class="w-[170px] truncate text-xs text-slate-600">{{ row.pembimbing }}</span>

            <template v-if="tab === 'bulanan'">
              <div class="flex w-[150px] flex-col gap-1.5">
                <span class="text-xs font-medium leading-[18px] text-slate-900">{{ row.bulanTerisi }} dari {{ row.totalBulan }} bulan</span>
                <div class="h-1.5 w-[120px] overflow-hidden rounded-full bg-slate-200">
                  <div class="h-full rounded-full bg-blue-600" :style="{ width: persen(row.bulanTerisi, row.totalBulan) + '%' }" />
                </div>
              </div>

              <div class="w-[130px]">
                <span :class="['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', STATUS[row.statusBulanIni].box]">
                  <span :class="['h-1.5 w-1.5 rounded-full', STATUS[row.statusBulanIni].dot]" />
                  {{ STATUS[row.statusBulanIni].label }}
                </span>
              </div>

              <div class="w-[110px] text-xs text-slate-500">
                <template v-if="row.rataRata != null">
                  <span class="text-sm font-bold text-slate-900">{{ row.rataRata }}</span> /100
                </template>
                <template v-else>—</template>
              </div>
            </template>

            <template v-else>
              <div class="w-[150px] text-xs text-slate-500">
                <template v-if="row.nilaiAkhir != null">
                  <span class="text-sm font-bold text-slate-900">{{ row.nilaiAkhir }}</span> /100
                </template>
                <template v-else>Belum diinput</template>
              </div>
            </template>

            <div class="flex w-[48px] justify-end">
              <router-link
                :to="`/admin/penilaian/${row.siswaId}`"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Lihat penilaian siswa"
                title="Lihat detail penilaian"
              >
                <AppIcon name="eye" class="h-5 w-5" />
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
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'
import SelectDropdown from '../../components/SelectDropdown.vue'
import { useListState } from '../../composables/useListState'

const PAGE_SIZE = 5

const STATUS = {
  sudah: { label: 'Sudah Diisi', box: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-700' },
  belum: { label: 'Belum Diisi', box: 'border-slate-200 bg-slate-100 text-slate-600', dot: 'bg-slate-500' },
}

const columnsBulanan = [
  { label: 'Siswa', width: 'flex-1', align: '' },
  { label: 'Guru Pembimbing', width: 'w-[170px]', align: '' },
  { label: 'Progres Bulanan', width: 'w-[150px]', align: '' },
  { label: 'Bulan Ini', width: 'w-[130px]', align: '' },
  { label: 'Nilai Rata-rata', width: 'w-[110px]', align: '' },
  { label: 'Aksi', width: 'w-[48px]', align: 'text-right' },
]
const columnsAkhir = [
  { label: 'Siswa', width: 'flex-1', align: '' },
  { label: 'Guru Pembimbing', width: 'w-[170px]', align: '' },
  { label: 'Nilai Akhir', width: 'w-[150px]', align: '' },
  { label: 'Aksi', width: 'w-[48px]', align: 'text-right' },
]

const rows = ref([])
const info = reactive({ bulanBerjalan: null, totalBulan: null, namaBulan: '' })
const loading = ref(false)
const error = ref('')
const page = ref(1)
const tab = ref('bulanan')
const searchInput = ref(null)

const programOptions = ref([])
const programItems = computed(() => [
  { value: '', label: 'Semua Program Studi' },
  ...programOptions.value.map((p) => ({ value: p, label: p })),
])

const draft = reactive({ search: '', periode: '', program: '' })
const applied = reactive({ ...draft })

useListState('penilaian', ['/admin/penilaian/'], {
  snapshot: () => ({ page: page.value, tab: tab.value, applied: { ...applied } }),
  restore: (s) => {
    page.value = s.page
    tab.value = s.tab
    Object.assign(applied, s.applied)
    Object.assign(draft, s.applied)
  },
})

async function load() {

}

function applyFilters() {
  Object.assign(applied, draft)
  page.value = 1
}

const base = computed(() => {
  const q = applied.search.toLowerCase()
  return rows.value.filter(
    (r) =>
      (!q || `${r.nama} ${r.nis}`.toLowerCase().includes(q)) &&
      (!applied.program || r.program === applied.program)
  )
})

const tabs = computed(() => [
  { key: 'bulanan', label: 'Penilaian Bulanan', count: base.value.length },
  { key: 'akhir', label: 'Nilai Akhir', count: base.value.filter((r) => r.nilaiAkhir != null).length },
])

const columns = computed(() => (tab.value === 'bulanan' ? columnsBulanan : columnsAkhir))

const filtered = computed(() => (tab.value === 'bulanan' ? base.value : base.value.filter((r) => r.nilaiAkhir != null)))

const stats = computed(() => {
  const list = base.value
  const has = list.length > 0
  return [
    {
      label: 'Penilaian Bulanan',
      value: info.bulanBerjalan != null ? `${info.bulanBerjalan} / ${info.totalBulan}` : null,
      hint: info.namaBulan ? `periode berjalan: ${info.namaBulan}` : '',
      icon: 'clipboard-check',
      tone: 'blue',
    },
    {
      label: 'Sudah Diisi',
      value: has ? list.filter((r) => r.statusBulanIni === 'sudah').length : null,
      hint: 'bulan ini oleh industri',
      icon: 'circle-check',
      tone: 'green',
    },
    {
      label: 'Belum Diisi',
      value: has ? list.filter((r) => r.statusBulanIni === 'belum').length : null,
      hint: 'menunggu pembimbing industri',
      icon: 'hourglass',
      tone: 'amber',
    },
    {
      label: 'Nilai Akhir Masuk',
      value: has ? list.filter((r) => r.nilaiAkhir != null).length : null,
      hint: 'diinput guru pembimbing',
      icon: 'award',
      tone: 'blue',
    },
  ]
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

const persen = (val, total) => (total ? Math.min(100, Math.round((val / total) * 100)) : 0)

function onKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

watch(tab, () => (page.value = 1))
watch(filtered, () => {
  if (page.value > lastPage.value) page.value = lastPage.value
})

onMounted(() => {
  window.addEventListener('keydown', onKey)
  load()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
