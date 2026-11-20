<template>
  <div class="p-4 sm:p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Siswa PKL', to: backTo }, { label: 'Detail Siswa' }]"
      title="Detail Siswa"
      subtitle="Data pribadi, orang tua, akademik, penempatan, dan progres PKL siswa."
    >
      <router-link
        :to="backTo"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </router-link>
      <router-link
        :to="`${backTo}/${id}/edit`"
        class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <AppIcon name="pencil" class="h-4 w-4" />
        Edit Data
      </router-link>
    </PageHeader>

    <PageSkeleton v-if="loading" />
    <div v-else-if="error" class="flex flex-col items-center gap-3 py-16 text-center">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">
        Coba lagi
      </button>
    </div>

    <div v-else class="flex flex-col gap-6">
      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div class="h-[86px] bg-blue-600"></div>
        <div class="flex flex-col gap-3 px-4 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:px-6">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
            <span class="-mt-10 flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-blue-600">
              <AppIcon name="user" class="h-10 w-10" />
            </span>
            <div class="pb-1">
              <h2 class="text-xl font-bold leading-7 tracking-[-0.02em] text-slate-900">{{ siswa.user?.name }}</h2>
              <p class="text-sm leading-5 text-slate-600">{{ subline }}</p>
            </div>
          </div>
          <span
            :class="['inline-flex items-center gap-1.5 self-start whitespace-nowrap rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', PKL_STATUS[pklStatus].box]"
          >
            <span :class="['h-1.5 w-1.5 rounded-full', PKL_STATUS[pklStatus].dot]" />
            {{ pklStatus === 'aktif' ? 'Aktif PKL' : PKL_STATUS[pklStatus].label }}
          </span>
        </div>

        <div class="grid grid-cols-1 gap-5 border-t border-slate-100 px-4 py-5 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
          <InfoItem icon="building" label="Tempat PKL" :value="lokasi?.perusahaan?.nama" :hint="perusahaan?.alamat" />
          <InfoItem icon="user-check" label="Pembimbing" :value="lokasi?.guru?.nama" />
          <InfoItem icon="calendar" label="Periode" :value="periode" :hint="gelombang?.nama" />
          <InfoItem icon="smartphone" label="Kontak" :value="siswa.telp" />
        </div>
      </section>

      <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" />
      </section>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <CardHeader title="Data Siswa" description="Diisi siswa saat melengkapi profil di aplikasi." />

          <div class="flex gap-6 overflow-x-auto border-b border-slate-200 px-4 sm:px-6">
            <button
              v-for="t in tabs"
              :key="t.key"
              type="button"
              :class="[
                'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-semibold',
                t.key === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900',
              ]"
              @click="tab = t.key"
            >
              {{ t.label }}
            </button>
          </div>

          <div class="px-4 py-6 sm:px-6">
            <div v-if="tab === 'pribadi'" class="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
              <InfoItem icon="user" label="Nama Lengkap" :value="siswa.user?.name" />
              <InfoItem icon="key-round" label="NIS / NISN" :value="nisNisn" />
              <InfoItem icon="calendar" label="Tempat, Tanggal Lahir" :value="ttl" />
              <InfoItem icon="user" label="Jenis Kelamin" :value="jenisKelamin" />
              <InfoItem icon="mail" label="Email" :value="siswa.user?.email" />
              <InfoItem icon="smartphone" label="Nomor HP" :value="siswa.telp" />
              <InfoItem icon="home" label="Alamat" :value="siswa.alamat" />
              <InfoItem
                icon="shield"
                label="Status Data"
                :value="siswa.profil_terkonfirmasi ? 'Lengkap' : 'Belum dikonfirmasi'"
                :hint="siswa.profil_terkonfirmasi ? `Dikonfirmasi ${formatDate(siswa.profil_confirmed_at)}` : 'Siswa belum mengonfirmasi profil'"
              />
            </div>

            <div v-else-if="tab === 'ortu'" class="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
              <InfoItem icon="user" label="Nama Orang Tua / Wali" :value="siswa.nama_ortu" />
              <InfoItem icon="smartphone" label="Nomor HP" :value="siswa.telp_ortu" />
              <InfoItem icon="home" label="Alamat" :value="siswa.alamat_ortu" hint="Opsional" />
              <InfoItem icon="shield" label="Status Data" :value="ortuTerisi ? 'Terisi' : 'Belum diisi'" hint="Diisi siswa dari aplikasi" />
            </div>

            <div v-else-if="tab === 'akademik'" class="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
              <InfoItem icon="key-round" label="NIS / NISN" :value="nisNisn" />
              <InfoItem icon="cap" label="Kelas" :value="siswa.kelas" />
              <InfoItem icon="briefcase" label="Program Studi" :value="siswa.jurusan?.nama" />
              <InfoItem icon="calendar" label="Tahun Ajaran" :value="siswa.gelombang?.tahun_ajaran" />
              <InfoItem icon="calendar" label="Gelombang PKL" :value="siswa.gelombang?.nama" :hint="gelombangHint" />
              <InfoItem icon="clipboard-check" label="Status PKL" :value="statusPkl" :hint="mingguHint" />
            </div>

            <div v-else>
              <p v-if="!lokasi" class="py-6 text-center text-sm text-slate-400">Siswa belum memiliki penempatan PKL.</p>
              <div v-else class="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                <InfoItem icon="building" label="Tempat PKL" :value="lokasi.perusahaan?.nama" />
                <InfoItem icon="pin" label="Alamat Penempatan" :value="perusahaan?.alamat" :hint="radiusHint" />
                <InfoItem icon="user-check" label="Guru Pembimbing" :value="lokasi.guru?.nama" />
                <InfoItem icon="user" label="Pembimbing Industri" :value="perusahaan?.pembimbing_industri" />
                <InfoItem icon="calendar" label="Periode PKL" :value="periode" :hint="periodeHint" />
                <InfoItem icon="hourglass" label="Sisa Hari PKL" :value="sisaHariText" :hint="sisaHint" />
              </div>
            </div>
          </div>
        </section>

        <div class="flex flex-col gap-6">
        <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <CardHeader title="Aktivitas Terbaru" description="Dari aplikasi siswa." />
          <SkeletonRows v-if="absLoading" :rows="4" :cols="2" :avatar="false" :action="false" />
          <p v-else-if="!aktivitas.length" class="px-6 py-10 text-center text-sm text-slate-400">Belum ada aktivitas presensi.</p>
          <ul v-else class="flex flex-col gap-5 px-4 py-6 sm:px-6">
            <li v-for="a in aktivitas" :key="a.id" class="flex items-start gap-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <AppIcon name="pin" class="h-5 w-5" />
              </span>
              <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                <span class="text-[10px] font-semibold uppercase leading-4 tracking-[0.06em] text-emerald-700">Presensi</span>
                <span class="text-xs font-semibold leading-[18px] text-slate-900">
                  Presensi {{ ABSEN_STATUS[a.status]?.label ?? a.status }}{{ a.jam_masuk ? ' ' + jamOnly(a.jam_masuk) : '' }}
                </span>
                <span class="truncate text-[11px] leading-[14px] text-slate-500">{{ a.keterangan || formatDate(a.tanggal) }}</span>
              </div>
              <span class="shrink-0 text-[11px] text-slate-500">{{ a.tanggal === todayIso ? 'Hari ini' : formatShort(a.tanggal) }}</span>
            </li>
          </ul>
        </section>

        <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <CardHeader title="Akses Cepat" />
          <div class="flex flex-col gap-3 px-4 pb-6 sm:px-6">
            <router-link
              :to="`${backTo}/${id}/presensi`"
              class="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 hover:bg-slate-50"
            >
              <AppIcon name="calendar-check" class="h-4 w-4" />
              Riwayat Presensi
            </router-link>
            <button
              type="button"
              disabled
              title="Belum tersedia"
              class="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AppIcon name="file" class="h-4 w-4" />
              Riwayat Jurnal
            </button>
            <button
              type="button"
              disabled
              title="Belum tersedia"
              class="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AppIcon name="award" class="h-4 w-4" />
              Riwayat Penilaian
            </button>
          </div>
        </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api, { getErrorMessage } from '../../services/api'
import {
  fetchAllPages,
  pickLokasi,
  pklStatusOf,
  hitungKehadiran,
  formatDate,
  formatShort,
  jamOnly,
  parseDate,
  toIso,
  PKL_STATUS,
  ABSEN_STATUS,
  LOKASI_STATUS,
} from '../../utils/siswa'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import InfoItem from '../../components/InfoItem.vue'
import AppIcon from '../../components/AppIcon.vue'
import SkeletonRows from '../../components/SkeletonRows.vue'
import PageSkeleton from '../../components/PageSkeleton.vue'

const props = defineProps({
  id: { type: String, required: true },
})

const backTo = '/admin/master-data/siswa'
const todayIso = toIso(new Date())

const tabs = [
  { key: 'pribadi', label: 'Data Pribadi' },
  { key: 'ortu', label: 'Data Orang Tua' },
  { key: 'akademik', label: 'Data Akademik' },
  { key: 'penempatan', label: 'Penempatan' },
]
const tab = ref('pribadi')

const loading = ref(true)
const error = ref('')
const siswa = ref({})
const lokasiList = ref([])
const lokasi = ref(null)
const perusahaan = ref(null)
const gelombang = ref(null)
const absensi = ref([])
const absLoading = ref(true)

const pklStatus = computed(() => pklStatusOf(lokasi.value))
const jenisKelamin = computed(() => ({ L: 'Laki-laki', P: 'Perempuan' })[siswa.value.jenis_kelamin] ?? '')
const subline = computed(() =>
  [`NIS ${siswa.value.nis}`, siswa.value.kelas, siswa.value.jurusan?.nama].filter(Boolean).join(' · ')
)
const periode = computed(() =>
  gelombang.value ? `${formatDate(gelombang.value.praktik_mulai)} – ${formatDate(gelombang.value.praktik_selesai)}` : ''
)
const aktivitas = computed(() => absensi.value.slice(0, 5))

const sisaHari = computed(() => {
  if (pklStatus.value !== 'aktif' || !gelombang.value) return null
  const end = parseDate(gelombang.value.praktik_selesai)
  if (!end) return null
  const start = new Date().setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((end - start) / 86400000))
})

const nisNisn = computed(() => [siswa.value.nis, siswa.value.nisn].filter(Boolean).join(' / '))
const ttl = computed(() => {
  const tgl = siswa.value.tanggal_lahir ? formatDate(siswa.value.tanggal_lahir) : ''
  return [siswa.value.tempat_lahir, tgl].filter(Boolean).join(', ')
})
const ortuTerisi = computed(() => !!(siswa.value.nama_ortu && siswa.value.telp_ortu))
const statusPkl = computed(() => (pklStatus.value === 'aktif' ? 'Aktif PKL' : PKL_STATUS[pklStatus.value].label))
const gelombangHint = computed(() =>
  gelombang.value && gelombang.value.id === siswa.value.gelombang?.id
    ? `${formatDate(gelombang.value.praktik_mulai)} – ${formatDate(gelombang.value.praktik_selesai)}`
    : ''
)
const mingguHint = computed(() => {
  const start = parseDate(gelombang.value?.praktik_mulai)
  const end = parseDate(gelombang.value?.praktik_selesai)
  if (pklStatus.value !== 'aktif' || !start || !end) return ''
  const total = Math.max(1, Math.ceil(((end - start) / 86400000 + 1) / 7))
  const now = Math.floor((Date.now() - start) / (7 * 86400000)) + 1
  return `Minggu ke-${Math.min(Math.max(now, 1), total)} dari ${total}`
})
const radiusHint = computed(() =>
  perusahaan.value?.radius_presensi ? `Radius presensi ${perusahaan.value.radius_presensi} meter` : ''
)
const periodeHint = computed(() => [gelombang.value?.nama, gelombang.value?.tahun_ajaran].filter(Boolean).join(' · '))
const sisaHariText = computed(() => (sisaHari.value != null ? `${sisaHari.value} hari` : ''))
const sisaHint = computed(() => (gelombang.value ? `Selesai ${formatDate(gelombang.value.praktik_selesai)}` : ''))

const stats = computed(() => {
  const k = hitungKehadiran(absensi.value)
  return [
    {
      label: 'Kehadiran',
      icon: 'calendar-check',
      tone: 'green',
      value: k.persen != null ? `${k.persen}%` : null,
      hint: absLoading.value ? 'memuat…' : `${k.hadir} dari ${k.efektif} hari`,
    },
    { label: 'Jurnal Terkirim', icon: 'file', tone: 'blue', value: null, hint: '', emptyHint: 'Belum tersedia' },
    { label: 'Nilai Rata-rata', icon: 'award', tone: 'blue', value: null, hint: '', emptyHint: 'Belum tersedia' },
    {
      label: 'Sisa Hari PKL',
      icon: 'hourglass',
      tone: 'amber',
      value: sisaHari.value,
      hint: gelombang.value ? `selesai ${formatDate(gelombang.value.praktik_selesai)}` : '',
    },
  ]
})

async function load() {
  loading.value = true
  error.value = ''
  absensi.value = []
  absLoading.value = true

  // Riwayat presensi (paling berat) dimuat paralel di belakang layar dan tidak menahan halaman.
  // Request-nya tetap berjalan bersamaan dengan data siswa, jadi tidak menambah waktu total.
  fetchAllPages('/api/absensi', { siswa_id: props.id })
    .then((rows) => {
      absensi.value = rows
    })
    .catch(() => {
      absensi.value = []
    })
    .finally(() => {
      absLoading.value = false
    })

  try {
    const [s, lok] = await Promise.all([
      api.get(`/api/siswa/${props.id}`),
      api.get(`/api/siswa/${props.id}/lokasi-pkl`),
    ])
    siswa.value = s.data.data
    lokasiList.value = lok.data.data
    lokasi.value = pickLokasi(lokasiList.value)

    const gid = lokasi.value?.gelombang?.id ?? siswa.value.gelombang?.id
    const pid = lokasi.value?.perusahaan?.id
    const [p, g] = await Promise.all([
      pid ? api.get(`/api/perusahaan/${pid}`).catch(() => null) : null,
      gid ? api.get(`/api/gelombang/${gid}`).catch(() => null) : null,
    ])
    perusahaan.value = p?.data?.data ?? null
    gelombang.value = g?.data?.data ?? null
  } catch (err) {
    error.value = getErrorMessage(err, 'Gagal memuat detail siswa.')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>