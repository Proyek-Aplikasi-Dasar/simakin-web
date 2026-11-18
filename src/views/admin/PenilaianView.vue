<template>
  <div class="p-4 sm:p-6 lg:p-8">
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
      <section class="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Status Penilaian Siswa" description="Progres penilaian bulanan dan nilai akhir.">
        </CardHeader>

        <div class="flex gap-6 overflow-x-auto border-b border-slate-200 px-4 sm:px-6">
          <button
            v-for="t in tabs"
            :key="t.key"
            type="button"
            :class="[
              '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-semibold',
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

        <form class="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6" @submit.prevent="applyFilters">
          <label class="flex h-10 w-full min-w-0 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-100 px-3 focus-within:ring-2 focus-within:ring-blue-200 sm:min-w-[240px] sm:flex-1">
            <AppIcon name="search" class="h-5 w-5 shrink-0 text-slate-400" />
            <input
              ref="searchInput"
              v-model="draft.search"
              type="text"
              placeholder="Cari nama / NIS siswa…"
              class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <span class="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium leading-[14px] text-slate-500 md:block">Ctrl K</span>
          </label>

          <label class="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 focus-within:ring-2 focus-within:ring-blue-200 sm:w-[200px]">
            <AppIcon name="calendar" class="h-4 w-4 shrink-0 text-slate-400" />
            <DatePicker v-model="draft.periode" mode="month" bare class="min-w-0 flex-1" />
          </label>

          <SelectDropdown
            v-model="draft.program"
            class="w-full sm:w-[220px]"
            icon="building"
            placeholder="Semua Program Studi"
            :options="programItems"
          />

          <button type="submit" class="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-600 hover:bg-blue-100 sm:w-auto">
            <AppIcon name="filter" class="h-5 w-5" />
            Terapkan
          </button>
        </form>

        <div v-if="error" class="flex flex-col items-center gap-3 border-t border-slate-100 px-6 py-12 text-center">
          <p class="text-sm text-red-600">{{ error }}</p>
          <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">Coba lagi</button>
        </div>

        <AdminTable
          v-else
          v-model:page="page"
          :columns="columns"
          :rows="filtered"
          :per-page="PAGE_SIZE"
          :loading="loading"
          entity="siswa"
          actions-width="w-[80px]"
        >
          <template #cell-nama="{ row }">
            <div class="flex min-w-0 items-center gap-2.5">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <AppIcon name="user" class="h-5 w-5" />
              </span>
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold leading-[18px] text-slate-900">{{ row.nama }}</p>
                <p class="truncate text-[11px] leading-[14px] text-slate-500">NIS {{ row.nis }} · {{ row.program }}</p>
              </div>
            </div>
          </template>

          <template #cell-progres="{ row }">
            <div class="flex flex-col gap-1.5">
              <span class="text-xs font-medium leading-[18px] text-slate-900">{{ row.bulanTerisi }} dari {{ row.totalBulan }} bulan</span>
              <div class="h-1.5 w-[120px] overflow-hidden rounded-full bg-slate-200">
                <div class="h-full rounded-full bg-blue-600" :style="{ width: persen(row.bulanTerisi, row.totalBulan) + '%' }" />
              </div>
            </div>
          </template>

          <template #cell-statusBulanIni="{ row }">
            <span :class="['inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', STATUS[row.statusBulanIni].box]">
              <span :class="['h-1.5 w-1.5 rounded-full', STATUS[row.statusBulanIni].dot]" />
              {{ STATUS[row.statusBulanIni].label }}
            </span>
          </template>

          <template #cell-rataRata="{ row }">
            <div class="text-xs text-slate-500">
              <template v-if="row.rataRata != null">
                <span class="text-sm font-bold text-slate-900">{{ row.rataRata }}</span> /100
              </template>
              <template v-else>—</template>
            </div>
          </template>

          <template #cell-nilaiAkhir="{ row }">
            <div class="text-xs text-slate-500">
              <template v-if="row.nilaiAkhir != null">
                <span class="text-sm font-bold text-slate-900">{{ row.nilaiAkhir }}</span> /100
              </template>
              <template v-else>Belum diinput</template>
            </div>
          </template>

          <template #actions="{ row }">
            <router-link
              :to="`/admin/penilaian/${row.siswaId}`"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Lihat penilaian siswa"
              title="Lihat detail penilaian"
            >
              <AppIcon name="eye" class="h-5 w-5" />
            </router-link>
          </template>
        </AdminTable>
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
import DatePicker from '../../components/DatePicker.vue'
import AdminTable from '../../components/AdminTable.vue'
import SelectDropdown from '../../components/SelectDropdown.vue'
import { useListState } from '../../composables/useListState'

const PAGE_SIZE = 5

const STATUS = {
  sudah: { label: 'Sudah Diisi', box: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-700' },
  belum: { label: 'Belum Diisi', box: 'border-slate-200 bg-slate-100 text-slate-600', dot: 'bg-slate-500' },
}

const columnsBulanan = [
  { key: 'nama', label: 'Siswa' },
  { key: 'pembimbing', label: 'Guru Pembimbing', width: 'w-[186px]', cellClass: 'sm:truncate' },
  { key: 'progres', label: 'Progres Bulanan', width: 'w-[166px]' },
  { key: 'statusBulanIni', label: 'Bulan Ini', width: 'w-[146px]' },
  { key: 'rataRata', label: 'Nilai Rata-rata', width: 'w-[126px]' },
]
const columnsAkhir = [
  { key: 'nama', label: 'Siswa' },
  { key: 'pembimbing', label: 'Guru Pembimbing', width: 'w-[186px]', cellClass: 'sm:truncate' },
  { key: 'nilaiAkhir', label: 'Nilai Akhir', width: 'w-[166px]' },
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

const persen = (val, total) => (total ? Math.min(100, Math.round((val / total) * 100)) : 0)

function onKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

watch(tab, () => (page.value = 1))

onMounted(() => {
  window.addEventListener('keydown', onKey)
  load()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
