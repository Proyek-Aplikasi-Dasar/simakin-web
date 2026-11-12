<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Monitoring' }, { label: 'Rekap Presensi & Jurnal' }]"
      title="Rekap Presensi & Jurnal"
      subtitle="Rekap kehadiran dan jurnal seluruh siswa per periode dan program studi."
    >
      <button
        type="button"
        class="flex h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold leading-5 text-slate-900 hover:bg-slate-50"
      >
        <AppIcon name="file-text" class="h-5 w-5 text-slate-600" />
        Export Excel
      </button>
      <button
        type="button"
        class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold leading-5 text-white hover:bg-blue-700"
      >
        <AppIcon name="printer" class="h-5 w-5" />
        Cetak Rekap
      </button>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Rekap per Siswa" description="Perbandingan kehadiran dan jurnal siswa." />

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
            placeholder="Semua Program"
            :options="programItems"
          />

          <SelectDropdown
            v-model="draft.pembimbing"
            class="w-[220px]"
            icon="user"
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

        <p v-if="loading" class="px-6 py-12 text-center text-sm text-slate-400">Memuat rekap…</p>
        <div v-else-if="error" class="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p class="text-sm text-red-600">{{ error }}</p>
          <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">Coba lagi</button>
        </div>
        <p v-else-if="!pageRows.length" class="px-6 py-12 text-center text-sm text-slate-400">Belum ada data rekap.</p>

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

            <span class="w-[130px] truncate text-xs text-slate-600">{{ row.pembimbing }}</span>

            <div class="flex w-[150px] flex-col gap-1.5">
              <span class="text-xs font-medium leading-[18px] text-slate-900">
                {{ row.hadir }} / {{ row.hariEfektif }} hari · {{ persen(row.hadir, row.hariEfektif) }}%
              </span>
              <div class="h-1.5 w-[120px] overflow-hidden rounded-full bg-slate-200">
                <div
                  :class="['h-full rounded-full', barColor(persen(row.hadir, row.hariEfektif))]"
                  :style="{ width: persen(row.hadir, row.hariEfektif) + '%' }"
                />
              </div>
            </div>

            <div class="flex w-[150px] flex-col gap-1.5">
              <span class="text-xs font-medium leading-[18px] text-slate-900">
                {{ row.jurnal }} / {{ row.hariEfektif }} jurnal
              </span>
              <div class="h-1.5 w-[120px] overflow-hidden rounded-full bg-slate-200">
                <div
                  :class="['h-full rounded-full', barColor(persen(row.jurnal, row.hariEfektif))]"
                  :style="{ width: persen(row.jurnal, row.hariEfektif) + '%' }"
                />
              </div>
            </div>

            <div class="w-[139px]">
              <span :class="['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', STATUS[row.status].box]">
                <span :class="['h-1.5 w-1.5 rounded-full', STATUS[row.status].dot]" />
                {{ STATUS[row.status].label }}
              </span>
            </div>

            <div class="flex w-[48px] justify-end">
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Lihat rekap siswa"
                title="Lihat rekap siswa"
              >
                <AppIcon name="eye" class="h-5 w-5" />
              </button>
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

const PAGE_SIZE = 5
const AMBANG_BINA = 80 

const STATUS = {
  baik: { label: 'Baik', box: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-700' },
  pembinaan: { label: 'Perlu Pembinaan', box: 'border-red-100 bg-red-50 text-red-700', dot: 'bg-red-700' },
}

const columns = [
  { label: 'Siswa', width: 'flex-1', align: '' },
  { label: 'Pembimbing', width: 'w-[130px]', align: '' },
  { label: 'Kehadiran', width: 'w-[150px]', align: '' },
  { label: 'Jurnal', width: 'w-[150px]', align: '' },
  { label: 'Status', width: 'w-[139px]', align: '' },
  { label: 'Aksi', width: 'w-[48px]', align: 'text-right' },
]

const rows = ref([])
const loading = ref(false)
const error = ref('')
const page = ref(1)
const searchInput = ref(null)

const programOptions = ref([])
const pembimbingOptions = ref([])
const programItems = computed(() => [
  { value: '', label: 'Semua Program' },
  ...programOptions.value.map((p) => ({ value: p, label: p })),
])
const pembimbingItems = computed(() => [
  { value: '', label: 'Semua Pembimbing' },
  ...pembimbingOptions.value.map((g) => ({ value: g, label: g })),
])

const draft = reactive({ search: '', periode: '', program: '', pembimbing: '' })
const applied = reactive({ ...draft })

async function load() {

}

function applyFilters() {
  Object.assign(applied, draft)
  page.value = 1
}

const filtered = computed(() => {
  const q = applied.search.toLowerCase()
  return rows.value.filter(
    (r) =>
      (!q || `${r.nama} ${r.nis}`.toLowerCase().includes(q)) &&
      (!applied.program || r.program === applied.program) &&
      (!applied.pembimbing || r.pembimbing === applied.pembimbing)
  )
})

const stats = computed(() => {
  const list = filtered.value
  const has = list.length > 0
  const hari = has ? list[0].hariEfektif : null
  const totalJurnal = list.reduce((a, r) => a + r.jurnal, 0)
  const targetJurnal = list.reduce((a, r) => a + r.hariEfektif, 0)
  const avg = has ? Math.round(list.reduce((a, r) => a + persen(r.hadir, r.hariEfektif), 0) / list.length) : null

  return [
    { label: 'Rata-rata Kehadiran', value: has ? `${avg}%` : null, hint: 'periode terpilih', icon: 'calendar-check', tone: 'green' },
    { label: 'Jurnal Terisi', value: has ? totalJurnal.toLocaleString('id-ID') : null, hint: `dari ${targetJurnal.toLocaleString('id-ID')} jurnal seharusnya`, icon: 'file', tone: 'blue' },
    { label: `Siswa < ${AMBANG_BINA}% Hadir`, value: has ? list.filter((r) => persen(r.hadir, r.hariEfektif) < AMBANG_BINA).length : null, hint: 'perlu pembinaan', icon: 'alert', tone: 'amber' },
    { label: 'Hari Efektif', value: hari, hint: 'periode terpilih', icon: 'calendar', tone: 'blue' },
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
const barColor = (p) => (p < AMBANG_BINA ? 'bg-red-700' : 'bg-emerald-700')

function onKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

watch(filtered, () => {
  if (page.value > lastPage.value) page.value = lastPage.value
})

onMounted(() => {
  window.addEventListener('keydown', onKey)
  load()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>