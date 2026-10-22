<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Data Master' }, { label: activeTab.label }]"
      title="Data Master"
      subtitle="Kelola data referensi yang dipakai di aplikasi siswa dan guru."
    >
      <router-link
        to="/admin/export-import"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="file" class="h-4 w-4" />
        Export / Import
      </router-link>

      <router-link
        v-if="activeTab.entity"
        :to="`/admin/data-master/${activeTab.key}/tambah`"
        class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <AppIcon name="plus" class="h-4 w-4" />
        Tambah {{ activeTab.entity }}
      </router-link>
    </PageHeader>

    <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex gap-8 overflow-x-auto border-b border-slate-200 px-6">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="[
            'flex items-center gap-2 whitespace-nowrap border-b-2 py-4 text-sm font-semibold',
            tab.key === activeTab.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900',
          ]"
          @click="selectTab(tab.key)"
        >
          {{ tab.label }}
          <span
            v-if="tab.resource && !tab.resource.loading"
            class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
          >
            {{ tab.resource.rows.length }}
          </span>
        </button>
      </div>

      <MasterTab
        v-if="activeTab.key === 'jurusan'"
        key="jurusan"
        title="Data Jurusan"
        subtitle="Jurusan aktif untuk penempatan PKL."
        entity="jurusan"
        base-path="/admin/data-master/jurusan"
        :columns="jurusanColumns"
        :resource="jurusan"
        delete-message="Jurusan yang masih dipakai kelas, siswa, atau kompetensi tidak bisa dihapus."
      />

      <MasterTab
        v-else-if="activeTab.key === 'kompetensi'"
        key="kompetensi"
        title="Data Kompetensi KI/KD"
        subtitle="Kompetensi yang dipilih siswa di dropdown jurnal harian."
        entity="kompetensi"
        base-path="/admin/data-master/kompetensi"
        :columns="kompetensiColumns"
        :resource="kompetensi"
      />

      <MasterTab
        v-else-if="activeTab.key === 'gelombang'"
        key="gelombang"
        title="Data Gelombang PKL"
        subtitle="Gelombang aktif menentukan siswa yang bisa presensi dan mengisi jurnal."
        entity="gelombang"
        base-path="/admin/data-master/gelombang"
        :columns="gelombangColumns"
        :resource="gelombang"
      />

      <MasterTab
        v-else-if="activeTab.key === 'perusahaan'"
        key="perusahaan"
        title="Data Perusahaan Mitra"
        subtitle="Perusahaan aktif muncul di daftar pilihan tempat PKL siswa."
        entity="perusahaan"
        base-path="/admin/data-master/perusahaan"
        :columns="perusahaanColumns"
        :resource="perusahaan"
      />

      <MasterTab
        v-else-if="activeTab.key === 'sikap'"
        key="sikap"
        title="Indikator Soft Skill"
        subtitle="Indikator yang dinilai pembimbing industri tiap bulan lewat HP siswa."
        entity="soft skill"
        base-path="/admin/data-master/sikap"
        :columns="sikapColumns"
        :resource="sikap"
      />

      <div v-else class="px-6 py-16 text-center text-sm text-slate-500">
        Data {{ activeTab.label }} belum tersedia. Menunggu endpoint dari BE.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '../../components/PageHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import MasterTab from '../../components/MasterTab.vue'
import { useMasterResource } from '../../composables/useMasterResource'

const route = useRoute()
const router = useRouter()

const toDate = (iso) => new Date(`${iso}T00:00:00`)
const fmt = (date, withYear) =>
  date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) })

function rentang(mulai, selesai) {
  const a = toDate(mulai)
  const b = toDate(selesai)
  return `${fmt(a, a.getFullYear() !== b.getFullYear())} – ${fmt(b, true)}`
}

function statusGelombang(mulai, selesai) {
  const sekarang = new Date()
  if (sekarang < toDate(mulai)) return 'Akan Datang'
  if (sekarang > new Date(`${selesai}T23:59:59`)) return 'Selesai'
  return 'Aktif'
}

const warnaStatus = (nilai) =>
  ({
    Aktif: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    'Akan Datang': 'border-blue-200 bg-blue-50 text-blue-700',
    Selesai: 'border-slate-200 bg-slate-100 text-slate-600',
  })[nilai] ?? ''

const jurusan = reactive(useMasterResource('/api/jurusan', { name: 'Jurusan' }))
const kompetensi = reactive(
  useMasterResource('/api/kompetensi', {
    name: 'Kompetensi',
    normalize: (row) => ({ ...row, jurusan_nama: row.jurusan?.nama ?? '-' }),
  })
)
const sikap = reactive(useMasterResource('/api/sikap', { name: 'Soft Skill', normalize: (row) => ({ ...row, deskripsi: row.deskripsi || '-' }) }))
const gelombang = reactive(
  useMasterResource('/api/gelombang', {
    name: 'Gelombang',
    normalize: (row) => ({
      ...row,
      pendaftaran: rentang(row.daftar_mulai, row.daftar_selesai),
      praktik: rentang(row.praktik_mulai, row.praktik_selesai),
      status: statusGelombang(row.praktik_mulai, row.praktik_selesai),
    }),
  })
)
const perusahaan = reactive(
  useMasterResource('/api/perusahaan', {
    name: 'Perusahaan',
    normalize: (row) => ({
      ...row,
      pimpinan: row.pimpinan || '-',
      kuota: row.kuota ?? '-',
      jurusan_nama: (row.jurusan ?? []).map((j) => j.nama).join(', ') || '-',
    }),
  })
)

const jurusanColumns = [
  { key: 'kode', label: 'Kode', cellClass: 'font-semibold text-blue-600' },
  { key: 'nama', label: 'Jurusan', cellClass: 'font-semibold text-slate-900' },
]
const kompetensiColumns = [
  { key: 'kode', label: 'Kode', cellClass: 'font-semibold text-blue-600' },
  { key: 'nama', label: 'Kompetensi', cellClass: 'font-semibold text-slate-900' },
  { key: 'jurusan_nama', label: 'Jurusan', cellClass: 'text-slate-600' },
]
const sikapColumns = [
  { key: 'nama', label: 'Soft Skill', cellClass: 'font-semibold text-slate-900' },
  { key: 'deskripsi', label: 'Deskripsi', cellClass: 'text-slate-600' },
]
const gelombangColumns = [
  { key: 'nama', label: 'Gelombang', cellClass: 'font-semibold text-slate-900' },
  { key: 'tahun_ajaran', label: 'Tahun Ajaran', cellClass: 'text-slate-600' },
  { key: 'pendaftaran', label: 'Pendaftaran', cellClass: 'text-slate-600' },
  { key: 'praktik', label: 'Praktik', cellClass: 'text-slate-600' },
  { key: 'status', label: 'Status', badge: warnaStatus },
]
const perusahaanColumns = [
  { key: 'nama', label: 'Perusahaan', cellClass: 'font-semibold text-slate-900' },
  { key: 'alamat', label: 'Alamat', cellClass: 'text-slate-600' },
  { key: 'pimpinan', label: 'Pimpinan', cellClass: 'text-slate-600' },
  { key: 'kuota', label: 'Kuota', cellClass: 'text-slate-600' },
  { key: 'jurusan_nama', label: 'Jurusan', cellClass: 'text-slate-600' },
]

const tabs = [
  { key: 'jurusan', label: 'Jurusan', entity: 'Jurusan', resource: jurusan },
  { key: 'kompetensi', label: 'Kompetensi KI/KD', entity: 'Kompetensi', resource: kompetensi },
  { key: 'sikap', label: 'Soft Skill', entity: 'Soft Skill', resource: sikap },
  { key: 'gelombang', label: 'Gelombang PKL', entity: 'Gelombang', resource: gelombang },
  { key: 'perusahaan', label: 'Perusahaan Mitra', entity: 'Perusahaan', resource: perusahaan },
]

const activeTab = computed(() => tabs.find((t) => t.key === route.query.tab) ?? tabs[0])

function selectTab(key) {
  router.replace({ query: { tab: key } })
}

onMounted(() => {
  jurusan.load()
  kompetensi.load()
  sikap.load()
  gelombang.load()
  perusahaan.load()
})
</script>