<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <PageHeader
      :breadcrumb="[{ label: 'PKL' }, { label: 'Lokasi & Penempatan' }]"
      title="Lokasi & Penempatan"
      subtitle="Atur lokasi PKL, kuota, dan alokasi siswa ke perusahaan."
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
        to="/admin/lokasi-penempatan/tambah"
        class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold leading-5 text-white hover:bg-blue-700"
      >
        <AppIcon name="pin" class="h-5 w-5" />
        Tambah Penempatan
      </router-link>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section class="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" :loading="loading" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader
          title="Daftar Penempatan per Lokasi"
          description="Lokasi PKL, koordinat presensi, dan keterisian kuota."
        />

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
          :data="rowsAll"
          :per-page="PAGE_SIZE"
          apply-button
          :loading="loading"
          :filters="filters"
          :filter-state="filterState"
          :search-keys="['cari']"
          search-placeholder="Cari perusahaan atau siswa…"
          entity="lokasi"
          actions-width="w-[140px]"
        >
          <template #cell-nama="{ row }">
            <div class="flex min-w-0 flex-col">
              <span class="text-sm font-semibold leading-5 text-slate-900 sm:truncate">{{ row.nama }}</span>
              <span v-if="row.bidang" class="text-xs leading-[18px] text-slate-500 sm:truncate">{{ row.bidang }}</span>
            </div>
          </template>

          <template #cell-alamat="{ row }">
            <div class="flex min-w-0 items-center gap-2 text-xs text-slate-600">
              <AppIcon name="pin" class="h-4 w-4 shrink-0 text-slate-400" />
              <span class="sm:truncate">{{ row.alamat }}</span>
            </div>
          </template>

          <template #cell-kuota="{ row }">
            <div class="flex flex-col gap-1.5">
              <span class="text-xs font-semibold leading-[18px] text-slate-900">{{ row.kuota_label }}</span>
              <div v-if="row.kuota != null" class="h-1.5 w-[120px] overflow-hidden rounded-full bg-slate-200">
                <div
                  :class="['h-full rounded-full', row.penuh ? 'bg-yellow-700' : 'bg-emerald-700']"
                  :style="{ width: `${row.persen}%` }"
                />
              </div>
            </div>
          </template>

          <template #cell-guru_label="{ row }">
            <span class="sm:truncate">{{ row.guru_label }}</span>
          </template>

          <template #actions="{ row }">
            <router-link
              :to="`/admin/lokasi-penempatan/${row.id}`"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Lihat lokasi"
              title="Lihat penempatan di lokasi ini"
            >
              <AppIcon name="eye" class="h-5 w-5" />
            </router-link>
            <router-link
              :to="editTarget(row)"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Edit penempatan"
              title="Edit penempatan siswa di lokasi ini"
            >
              <AppIcon name="pencil" class="h-5 w-5" />
            </router-link>
          </template>
        </BaseTable>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getErrorMessage } from '../../services/api'
import { fetchAllPages } from '../../utils/siswa'
import { MEMAKAI_KUOTA } from '../../utils/lokasi'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'
import BaseTable from '../../components/BaseTable.vue'
import { useListState } from '../../composables/useListState'

const PAGE_SIZE = 5

const columns = [
  { key: 'nama', label: 'Perusahaan' },
  { key: 'alamat', label: 'Alamat', width: 'w-[216px]' },
  { key: 'kuota', label: 'Kuota', width: 'w-[156px]', sortValue: (r) => r.terisi },
  { key: 'guru_label', label: 'Pembimbing', width: 'w-[146px]' },
]

const perusahaan = ref([])
const penempatan = ref([])
const loading = ref(true)
const error = ref('')
const page = ref(1)
const search = ref('')
const filterState = reactive({ kota: '', guru: '' })

useListState('lokasi-penempatan', ['/admin/lokasi-penempatan/', '/admin/data-master/perusahaan/'], {
  snapshot: () => ({ page: page.value, search: search.value, filter: { ...filterState } }),
  restore: (s) => {
    page.value = s.page
    search.value = s.search ?? ''
    Object.assign(filterState, s.filter ?? {})
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

function editTarget(row) {
  if (row.penempatanIds.length === 1) return `/admin/lokasi-penempatan/penempatan/${row.penempatanIds[0]}/edit`
  if (!row.penempatanIds.length) return `/admin/lokasi-penempatan/tambah?perusahaan_id=${row.id}`
  return `/admin/lokasi-penempatan/${row.id}`
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
      mitraAktif: p.is_active !== false,
      alamat: p.alamat || '-',
      kota: kotaOf(p.alamat),
      bidang: singkat((p.jurusan ?? []).map((j) => j.nama)),
      kuota: p.kuota,
      terisi,
      sisa: p.kuota == null ? 0 : Math.max(p.kuota - terisi, 0),
      penuh: p.kuota != null && terisi >= p.kuota,
      persen: p.kuota ? Math.min(100, Math.round((terisi / p.kuota) * 100)) : 0,
      aktif: list.filter((l) => l.status === 'active').length,
      penempatanIds: list.map((l) => l.id),
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

const filters = computed(() => [
  { key: 'kota', label: 'Kota', icon: 'pin', options: kotaOptions.value.map((k) => ({ value: k, label: k })) },
  {
    key: 'guru',
    label: 'Pembimbing',
    icon: 'user-check',
    options: guruOptions.value.map((g) => ({ value: g.id, label: g.nama })),
    match: (row, value) => row.guruIds.includes(Number(value)),
  },
])

const stats = computed(() => {
  const ready = !loading.value && !error.value
  const rows = rowsAll.value
  const industri = new Set(perusahaan.value.map((p) => p.pembimbing_industri?.trim()).filter(Boolean))
  return [
    {
      label: 'Lokasi Aktif',
      icon: 'building',
      tone: 'blue',
      value: ready ? rows.filter((r) => r.mitraAktif).length : null,
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
      label: 'Pembimbing Industri',
      icon: 'user',
      tone: 'blue',
      value: ready ? industri.size : null,
      hint: 'terdaftar di sistem',
    },
  ]
})

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

onMounted(load)
</script>
