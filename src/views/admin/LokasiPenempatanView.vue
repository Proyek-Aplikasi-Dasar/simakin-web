<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'PKL' }, { label: 'Lokasi & Penempatan' }]"
      title="Lokasi & Penempatan"
      subtitle="Atur lokasi PKL, kuota, dan alokasi siswa ke perusahaan."
    >
      <router-link
        to="/admin/export-import"
        class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold leading-5 hover:bg-slate-50"
      >
        <AppIcon name="file-text" class="h-5 w-5" />
        Export / Import
      </router-link>

      <router-link
        to="/admin/lokasi-penempatan/tambah"
        class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold leading-5 text-white hover:bg-blue-700"
      >
        <AppIcon name="pin" class="h-5 w-5" />
        Tambah Penempatan
      </router-link>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader
          title="Daftar Penempatan per Lokasi"
          description="Lokasi PKL, koordinat presensi, dan keterisian kuota."
        />

        <form class="flex flex-wrap items-center gap-3 px-6 py-4" @submit.prevent="applyFilters">
          <label
            class="flex h-10 min-w-[240px] flex-1 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-100 px-3 focus-within:ring-2 focus-within:ring-blue-200"
          >
            <AppIcon name="search" class="h-5 w-5 shrink-0 text-slate-400" />
            <input
              ref="searchInput"
              v-model="draftSearch"
              type="text"
              placeholder="Cari perusahaan atau siswa…"
              class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <span class="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium leading-[14px] text-slate-500">
              Ctrl K
            </span>
          </label>

          <SelectDropdown
            v-model="draftKota"
            class="w-[220px]"
            icon="pin"
            placeholder="Semua Kota"
            :options="kotaItems"
          />

          <SelectDropdown
            v-model="draftGuru"
            class="w-[220px]"
            icon="user-check"
            placeholder="Semua Pembimbing"
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

        <p v-if="loading" class="px-6 py-12 text-center text-sm text-slate-400">Memuat data lokasi…</p>
        <div v-else-if="error" class="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p class="text-sm text-red-600">{{ error }}</p>
          <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">
            Coba lagi
          </button>
        </div>
        <p v-else-if="!pageRows.length" class="px-6 py-12 text-center text-sm text-slate-400">
          Tidak ada lokasi yang cocok.
        </p>

        <div v-else class="divide-y divide-slate-100">
          <div v-for="row in pageRows" :key="row.id" class="flex items-center gap-4 px-6 py-3">
            <div class="flex min-w-0 flex-1 flex-col">
              <span class="truncate text-sm font-semibold leading-5 text-slate-900">{{ row.nama }}</span>
              <span v-if="row.bidang" class="truncate text-xs leading-[18px] text-slate-500">{{ row.bidang }}</span>
            </div>

            <div class="flex w-[260px] items-center gap-2 text-xs text-slate-600">
              <AppIcon name="pin" class="h-4 w-4 shrink-0 text-slate-400" />
              <span class="truncate">{{ row.alamat }}</span>
            </div>

            <div class="flex w-[200px] flex-col gap-1.5">
              <span class="text-xs font-semibold leading-[18px] text-slate-900">{{ row.kuota_label }}</span>
              <div v-if="row.kuota != null" class="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  :class="['h-full rounded-full', row.penuh ? 'bg-yellow-700' : 'bg-emerald-700']"
                  :style="{ width: `${row.persen}%` }"
                />
              </div>
            </div>

            <span class="w-[170px] truncate text-xs text-slate-600">{{ row.guru_label }}</span>

            <div class="flex w-[96px] justify-end gap-2">
              <router-link
                :to="`/admin/lokasi-penempatan/${row.id}`"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Lihat lokasi"
                title="Lihat penempatan di lokasi ini"
              >
                <AppIcon name="eye" class="h-5 w-5" />
              </router-link>
              <router-link
                :to="{ path: `/admin/data-master/perusahaan/${row.id}/edit`, query: { from: 'lokasi' } }"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Edit lokasi"
                title="Edit data perusahaan, koordinat, dan kuota"
              >
                <AppIcon name="pencil" class="h-5 w-5" />
              </router-link>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 text-xs text-slate-600">
          <span>
            <template v-if="filtered.length">Menampilkan {{ from }}–{{ to }} dari {{ filtered.length }} lokasi</template>
            <template v-else>Tidak ada lokasi</template>
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
import { getErrorMessage } from '../../services/api'
import { fetchAllPages } from '../../utils/siswa'
import { MEMAKAI_KUOTA } from '../../utils/lokasi'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'
import SelectDropdown from '../../components/SelectDropdown.vue'
import { useListState } from '../../composables/useListState'

const PAGE_SIZE = 5

const columns = [
  { label: 'Perusahaan', width: 'flex-1', align: '' },
  { label: 'Alamat', width: 'w-[260px]', align: '' },
  { label: 'Kuota', width: 'w-[200px]', align: '' },
  { label: 'Pembimbing', width: 'w-[170px]', align: '' },
  { label: 'Aksi', width: 'w-[96px]', align: 'text-right' },
]

const perusahaan = ref([])
const penempatan = ref([])
const loading = ref(true)
const error = ref('')
const page = ref(1)
const searchInput = ref(null)

const draftSearch = ref('')
const draftKota = ref('')
const draftGuru = ref('')
const applied = reactive({ search: '', kota: '', guru: '' })

useListState('lokasi-penempatan', ['/admin/lokasi-penempatan/', '/admin/data-master/perusahaan/'], {
  snapshot: () => ({ page: page.value, applied: { ...applied } }),
  restore: (s) => {
    page.value = s.page
    Object.assign(applied, s.applied)
    draftSearch.value = s.applied.search
    draftKota.value = s.applied.kota
    draftGuru.value = s.applied.guru
  },
})

function kotaOf(alamat) {
  if (!alamat || !alamat.includes(',')) return ''
  return alamat.split(',').pop().replace(/\b\d{5}\b/g, '').trim()
}

function singkat(list, max = 2) {
  if (!list.length) return ''
  return list.length > max ? `${list.slice(0, max).join(', ')} +${list.length - max}` : list.join(', ')
}

const rowsAll = computed(() => {
  const byPerusahaan = new Map()
  penempatan.value.forEach((l) => {
    if (!MEMAKAI_KUOTA.includes(l.status)) return 
    const pid = l.perusahaan?.id
    if (!byPerusahaan.has(pid)) byPerusahaan.set(pid, [])
    byPerusahaan.get(pid).push(l)
  })

  return perusahaan.value.map((p) => {
    const list = byPerusahaan.get(p.id) ?? []
    const terisi = list.length
    const guru = new Map()
    list.forEach((l) => l.guru && guru.set(l.guru.id, l.guru.nama))

    return {
      id: p.id,
      nama: p.nama,
      alamat: p.alamat || '-',
      kota: kotaOf(p.alamat),
      bidang: singkat((p.jurusan ?? []).map((j) => j.nama)),
      kuota: p.kuota,
      terisi,
      sisa: p.kuota == null ? 0 : Math.max(p.kuota - terisi, 0),
      penuh: p.kuota != null && terisi >= p.kuota,
      persen: p.kuota ? Math.min(100, Math.round((terisi / p.kuota) * 100)) : 0,
      aktif: list.filter((l) => l.status === 'active').length,
      guruIds: [...guru.keys()],
      guru_label: singkat([...guru.values()]) || '-',
      kuota_label: p.kuota == null ? `${terisi} siswa` : `${terisi} / ${p.kuota} siswa`,
      cari: `${p.nama} ${p.alamat ?? ''} ${list.map((l) => l.siswa?.nama ?? '').join(' ')}`.toLowerCase(),
    }
  })
})

const kotaOptions = computed(() => [...new Set(rowsAll.value.map((r) => r.kota).filter(Boolean))].sort())

const guruOptions = computed(() => {
  const map = new Map()
  penempatan.value.forEach((l) => l.guru && MEMAKAI_KUOTA.includes(l.status) && map.set(l.guru.id, l.guru.nama))
  return [...map].map(([id, nama]) => ({ id, nama })).sort((a, b) => a.nama.localeCompare(b.nama))
})

const kotaItems = computed(() => [
  { value: '', label: 'Semua Kota' },
  ...kotaOptions.value.map((k) => ({ value: k, label: k })),
])
const guruItems = computed(() => [
  { value: '', label: 'Semua Pembimbing' },
  ...guruOptions.value.map((g) => ({ value: String(g.id), label: g.nama })),
])

const filtered = computed(() => {
  const q = applied.search.toLowerCase()
  return rowsAll.value.filter(
    (r) =>
      (!q || r.cari.includes(q)) &&
      (!applied.kota || r.kota === applied.kota) &&
      (!applied.guru || r.guruIds.includes(Number(applied.guru)))
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

watch(lastPage, (last) => {
  if (page.value > last) page.value = last
})

const stats = computed(() => {
  const ready = !loading.value && !error.value
  const rows = rowsAll.value
  const guruAktif = new Set(rows.flatMap((r) => r.guruIds))
  return [
    {
      label: 'Lokasi Aktif',
      icon: 'building',
      tone: 'blue',
      value: ready ? rows.length : null,
      hint: 'perusahaan mitra',
    },
    {
      label: 'Siswa Ditempatkan',
      icon: 'pin',
      tone: 'green',
      value: ready ? rows.reduce((n, r) => n + r.aktif, 0) : null,
      hint: `di ${rows.filter((r) => r.aktif > 0).length} lokasi`,
    },
    {
      label: 'Sisa Kuota',
      icon: 'briefcase',
      tone: 'amber',
      value: ready ? rows.reduce((n, r) => n + r.sisa, 0) : null,
      hint: `kursi di ${rows.filter((r) => r.sisa > 0).length} perusahaan`,
    },
    {
      label: 'Guru Pembimbing',
      icon: 'user-check',
      tone: 'blue',
      value: ready ? guruAktif.size : null,
      hint: 'terlibat di penempatan',
    },
  ]
})

function applyFilters() {
  applied.search = draftSearch.value.trim()
  applied.kota = draftKota.value
  applied.guru = draftGuru.value
  page.value = 1
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [p, l] = await Promise.all([fetchAllPages('/api/perusahaan'), fetchAllPages('/api/lokasi-pkl')])
    perusahaan.value = p
    penempatan.value = l
  } catch (err) {
    perusahaan.value = []
    penempatan.value = []
    error.value = getErrorMessage(err, 'Gagal memuat data lokasi.')
  } finally {
    loading.value = false
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