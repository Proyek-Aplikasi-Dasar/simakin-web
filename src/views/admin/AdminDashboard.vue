<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Utama' }, { label: 'Dashboard' }]"
      :title="`Selamat ${waktu}, ${auth.user?.name ?? ''}`"
      subtitle="Ringkasan data global dan aktivitas sistem SimakIn hari ini."
    >
      <router-link
        to="/admin/pengajuan-pkl"
        class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold leading-5 text-white hover:bg-blue-700"
      >
        <AppIcon name="circle-check" class="h-5 w-5" />
        Verifikasi Pengajuan
      </router-link>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section
        class="relative flex flex-col items-start gap-4 overflow-hidden rounded-3xl bg-blue-600 px-5 py-5 text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.35)] sm:flex-row sm:items-center sm:gap-6 sm:px-8 sm:py-6"
      >
        <div class="absolute -top-[120px] left-[820px] h-[260px] w-[260px] rounded-full bg-blue-700"></div>
        <div class="absolute left-[960px] top-[40px] h-[180px] w-[180px] rounded-full bg-blue-700"></div>
        <div class="absolute left-[60px] top-[70px] h-[120px] w-[120px] rounded-full bg-blue-700"></div>

        <div class="relative flex min-w-0 flex-col gap-2">
          <span
            v-if="loadingGelombang"
            class="block h-6 w-64 max-w-full animate-pulse rounded-full bg-white/25"
          ></span>
          <span
            v-else-if="gelombangLabel"
            class="inline-flex w-fit items-center gap-1.5 rounded-full bg-yellow-400 px-2.5 py-1 text-[11px] font-semibold leading-[14px] text-slate-900"
          >
            <AppIcon name="calendar" class="h-3.5 w-3.5" />
            {{ gelombangLabel }}
          </span>

          <span
            v-if="loadingRingkasan && pengajuanPending === null"
            class="my-1 block h-5 w-72 max-w-full animate-pulse rounded bg-white/25"
          ></span>
          <h2 v-else class="text-xl font-semibold leading-[30px] tracking-[-0.02em]">{{ bannerTitle }}</h2>
          <p class="text-xs leading-[18px] text-blue-200">
            Verifikasi pengajuan siswa agar penempatan dan guru pembimbing bisa segera ditetapkan.
          </p>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <div class="h-2 w-full overflow-hidden rounded-full bg-white sm:w-80">
              <div
                class="h-full rounded-full bg-yellow-400 transition-all duration-500"
                :style="{ width: `${persenPenempatan ?? 0}%` }"
              ></div>
            </div>
            <span v-if="loadingRingkasan" class="block h-3 w-44 animate-pulse rounded bg-white/25"></span>
            <span v-else class="text-[11px] font-medium leading-[14px]">
              {{ persenPenempatan === null ? 'Data penempatan belum tersedia' : `${persenPenempatan}% siswa sudah ditempatkan` }}
            </span>
          </div>
        </div>

        <router-link
          to="/admin/pengajuan-pkl"
          class="relative flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold leading-5 text-slate-900 hover:bg-slate-50"
        >
          <AppIcon name="arrow-right" class="h-5 w-5" />
          Lihat Pengajuan
        </router-link>
      </section>

      <section class="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" :loading="loadingRingkasan" />
      </section>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_352px]">
        <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <CardHeader
            title="Pengajuan PKL Terbaru"
            description="Pengajuan tempat PKL dari aplikasi siswa."
            action="Lihat semua"
            to="/admin/pengajuan-pkl"
          />
          <div class="hidden items-center gap-4 border-t border-slate-100 bg-slate-100 px-6 py-2.5 sm:flex">
            <span class="flex-1 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Siswa</span>
            <span class="w-[170px] text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Perusahaan</span>
            <span class="w-[101px] text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Status</span>
            <span class="w-10"></span>
          </div>

          <ul v-if="loading" role="status" aria-busy="true" aria-label="Memuat data">
            <li
              v-for="i in 5"
              :key="i"
              class="flex items-center gap-3 border-t border-slate-100 px-4 py-3 first:border-t-0 sm:gap-4 sm:px-6"
            >
              <div class="flex min-w-0 flex-1 items-center gap-2.5">
                <span class="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200"></span>
                <div class="flex min-w-0 flex-1 flex-col gap-2">
                  <span class="h-3 w-32 max-w-full animate-pulse rounded bg-slate-200"></span>
                  <span class="h-2.5 w-24 max-w-full animate-pulse rounded bg-slate-100"></span>
                </div>
              </div>
              <span class="hidden h-3 w-[170px] animate-pulse rounded bg-slate-200 sm:block"></span>
              <span class="h-6 w-[101px] animate-pulse rounded-full bg-slate-100"></span>
              <span class="h-10 w-10 animate-pulse rounded-xl bg-slate-100"></span>
            </li>
          </ul>
          <ul v-else-if="pengajuanTerbaru.length">
            <li
              v-for="row in pengajuanTerbaru"
              :key="row.id"
              class="flex items-center gap-3 border-t border-slate-100 px-4 py-3 first:border-t-0 sm:gap-4 sm:px-6"
            >
              <div class="flex min-w-0 flex-1 items-center gap-2.5">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <AppIcon name="user" class="h-5 w-5" />
                </span>
                <div class="min-w-0">
                  <p class="truncate text-xs font-semibold leading-[18px] text-slate-900">{{ row.siswa?.nama ?? '-' }}</p>
                  <p class="truncate text-[11px] leading-[14px] text-slate-500">
                    NIS {{ row.siswa?.nis ?? '-' }}<template v-if="row.siswa?.jurusan"> · {{ row.siswa.jurusan.kode }}</template>
                  </p>
                  <p class="truncate text-[11px] leading-[14px] text-slate-500 sm:hidden">{{ row.perusahaan?.nama ?? '-' }}</p>
                </div>
              </div>

              <p class="hidden w-[170px] truncate text-xs leading-[18px] text-slate-600 sm:block" :title="row.perusahaan?.nama">
                {{ row.perusahaan?.nama ?? '-' }}
              </p>

              <div class="shrink-0 sm:w-[101px]">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4',
                    (statusMap[row.status] ?? statusMap.pending).badge,
                  ]"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                  {{ (statusMap[row.status] ?? statusMap.pending).label }}
                </span>
              </div>

              <router-link
                :to="`/admin/pengajuan-pkl/${row.id}`"
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                aria-label="Lihat detail pengajuan"
                title="Lihat detail pengajuan"
              >
                <AppIcon name="eye" class="h-5 w-5" />
              </router-link>
            </li>
          </ul>
          <p v-else class="px-6 py-12 text-center text-sm text-slate-400">
            {{ errors.pengajuan ? 'Gagal memuat data pengajuan.' : 'Belum ada pengajuan PKL.' }}
          </p>
        </section>

        <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <CardHeader title="Akses Cepat" description="Pintasan tugas admin." />
          <div class="grid grid-cols-2 gap-3 px-4 py-1 sm:px-6">
            <router-link
              v-for="item in shortcuts"
              :key="item.label"
              :to="item.to"
              class="flex flex-col items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-100 p-4 text-xs font-semibold leading-4 text-slate-900 hover:bg-slate-200"
            >
              <span :class="['flex h-10 w-10 items-center justify-center rounded-lg', tones[item.tone]]">
                <AppIcon :name="item.icon" class="h-5 w-5" />
              </span>
              {{ item.label }}
            </router-link>
          </div>
        </section>
      </div>

      <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_352px]">
        <section class="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <CardHeader
            title="Kehadiran per Program Studi"
            :description="deskripsiKehadiran"
            action="Rekap lengkap"
            to="/admin/rekap-presensi-jurnal"
          />

          <div
            v-if="loadingKehadiran"
            class="flex flex-1 flex-col gap-4 px-4 py-3 sm:flex-row sm:gap-8 sm:px-6"
            role="status"
            aria-busy="true"
            aria-label="Memuat data"
          >
            <ul v-for="c in 2" :key="c" class="flex min-w-0 flex-1 flex-col gap-4 self-start">
              <li v-for="r in 4" :key="r" class="flex items-center gap-3">
                <span class="h-3 w-11 shrink-0 animate-pulse rounded bg-slate-200"></span>
                <span class="h-2 min-w-0 flex-1 animate-pulse rounded-full bg-slate-200"></span>
                <span class="h-3 w-9 shrink-0 animate-pulse rounded bg-slate-200"></span>
              </li>
            </ul>
          </div>
          <div v-else-if="kehadiranJurusan.length" class="flex flex-1 flex-col gap-4 px-4 py-3 sm:flex-row sm:gap-8 sm:px-6">
            <ul v-for="(kolom, i) in kolomKehadiran" :key="i" class="flex min-w-0 flex-1 flex-col gap-4 self-start">
              <li v-for="j in kolom" :key="j.id" class="flex items-center gap-3">
                <span class="w-11 shrink-0 truncate text-[10px] font-semibold leading-[14px] text-slate-600" :title="j.nama">{{ j.kode }}</span>
                <div class="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    v-if="j.persen !== null"
                    :class="['h-full rounded-full transition-all duration-500', j.persen >= 90 ? 'bg-blue-600' : 'bg-yellow-700']"
                    :style="{ width: `${j.persen}%` }"
                  ></div>
                </div>
                <span
                  :class="[
                    'w-9 shrink-0 text-right text-[10px] font-semibold leading-[14px]',
                    j.persen === null ? 'text-slate-400' : j.persen >= 90 ? 'text-blue-600' : 'text-yellow-700',
                  ]"
                >
                  {{ j.persen === null ? '—' : `${j.persen}%` }}
                </span>
              </li>
            </ul>
          </div>
          <p v-else class="flex-1 px-6 py-12 text-center text-sm text-slate-400">
            {{ errors.kehadiran ? 'Gagal memuat data kehadiran.' : 'Data kehadiran belum tersedia.' }}
          </p>

          <div class="flex flex-wrap gap-x-4 gap-y-2 px-4 py-4 sm:px-8">
            <span class="flex items-center gap-2 text-[11px] font-medium leading-[14px] text-slate-600">
              <span class="h-2 w-2 rounded-full bg-blue-600"></span>
              ≥ 90% sesuai target
            </span>
            <span class="flex items-center gap-2 text-[11px] font-medium leading-[14px] text-slate-600">
              <span class="h-2 w-2 rounded-full bg-yellow-700"></span>
              &lt; 90% perlu perhatian
            </span>
          </div>
        </section>

        <section class="flex flex-col self-stretch overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <CardHeader
            title="Aktivitas Sistem"
            description="Aktivitas pengajuan PKL terakhir."
            action="Lihat semua"
            to="/admin/notifikasi"
          />

          <ul v-if="loading" class="flex flex-col gap-1 px-3" role="status" aria-busy="true" aria-label="Memuat data">
            <li v-for="i in 4" :key="i" class="flex items-start gap-4 rounded-xl p-4">
              <span class="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-slate-200"></span>
              <div class="flex min-w-0 flex-1 flex-col gap-2">
                <span class="h-2.5 w-16 animate-pulse rounded bg-slate-100"></span>
                <span class="h-3 w-40 max-w-full animate-pulse rounded bg-slate-200"></span>
                <span class="h-3 w-32 max-w-full animate-pulse rounded bg-slate-100"></span>
              </div>
              <span class="h-3 w-8 shrink-0 animate-pulse rounded bg-slate-100"></span>
            </li>
          </ul>
          <ul v-else-if="aktivitas.length" class="flex flex-col gap-1 px-3">
            <li v-for="a in aktivitas" :key="a.key" class="flex items-start gap-4 rounded-xl p-4">
              <span :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tones[a.tone]]">
                <AppIcon :name="a.icon" class="h-5 w-5" />
              </span>
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <p :class="['text-[10px] font-semibold uppercase leading-4 tracking-[0.6px]', toneText[a.tone]]">{{ a.kategori }}</p>
                <p class="text-xs font-semibold leading-[18px] text-slate-900">{{ a.judul }}</p>
                <p class="text-xs leading-[18px] text-slate-500">{{ a.deskripsi }}</p>
              </div>
              <span class="shrink-0 text-[11px] font-medium leading-[14px] text-slate-500">{{ waktuSingkat(a.waktu) }}</span>
            </li>
          </ul>
          <p v-else class="flex-1 px-6 py-12 text-center text-sm text-slate-400">Belum ada aktivitas.</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import { fetchAll } from '../../composables/useMasterResource'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'


const auth = useAuthStore()

const waktu = computed(() => {
  const jam = new Date().getHours()
  if (jam < 11) return 'pagi'
  if (jam < 15) return 'siang'
  if (jam < 18) return 'sore'
  return 'malam'
})

const loading = ref(true)
const loadingKehadiran = ref(true)
const loadingRingkasan = ref(true)
const loadingGelombang = ref(true)
const errors = reactive({ dashboard: false, pengajuan: false, kehadiran: false })

const ringkasan = ref(null) 
const gelombang = ref(null) 
const perusahaanKuota = ref(null) 
const pengajuan = ref([]) 
const kehadiranJurusan = ref([])
const pengajuanPending = ref(null)

const isoLokal = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const parseTanggal = (s) => new Date(`${s}T00:00:00`)
const HARI_MS = 24 * 60 * 60 * 1000

function waktuSingkat(iso) {
  const menit = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (menit < 1) return 'Baru saja'
  if (menit < 60) return `${menit}m`
  const jam = Math.floor(menit / 60)
  if (jam < 24) return `${jam}j`
  const hari = Math.floor(jam / 24)
  if (hari === 1) return 'Kemarin'
  if (hari < 7) return `${hari}h`
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function pilihGelombang(list) {
  if (!list.length) return null
  const hariIni = parseTanggal(isoLokal(new Date()))
  const dalam = (mulai, selesai) => hariIni >= parseTanggal(mulai) && hariIni <= parseTanggal(selesai)
  return (
    list.find((g) => dalam(g.praktik_mulai, g.praktik_selesai)) ||
    list.find((g) => dalam(g.daftar_mulai, g.daftar_selesai)) ||
    list[0]
  )
}

const gelombangLabel = computed(() => {
  const g = gelombang.value
  if (!g) return ''
  const mulai = parseTanggal(g.praktik_mulai)
  const selesai = parseTanggal(g.praktik_selesai)
  const hariIni = parseTanggal(isoLokal(new Date()))
  const totalMinggu = Math.max(1, Math.ceil((selesai - mulai + HARI_MS) / (7 * HARI_MS)))

  let posisi
  if (hariIni < mulai) posisi = 'Belum dimulai'
  else if (hariIni > selesai) posisi = 'Selesai'
  else {
    const ke = Math.min(totalMinggu, Math.floor((hariIni - mulai) / (7 * HARI_MS)) + 1)
    posisi = `Minggu ke-${ke} dari ${totalMinggu}`
  }
  return `${g.nama} · ${g.tahun_ajaran} · ${posisi}`
})

const bannerTitle = computed(() => {
  const n = pengajuanPending.value ?? ringkasan.value?.pengajuan_pending
  if (n === undefined || n === null) return 'Pengajuan PKL menunggu verifikasi'
  return n > 0 ? `${n} pengajuan PKL menunggu verifikasi` : 'Tidak ada pengajuan yang menunggu verifikasi'
})

const persenPenempatan = computed(() => {
  const r = ringkasan.value
  if (!r || !r.total_siswa) return null
  const ditempatkan = (r.siswa_by_status?.active ?? 0) + (r.siswa_by_status?.completed ?? 0)
  return Math.min(100, Math.round((ditempatkan / r.total_siswa) * 100))
})

const kehadiranHariIni = computed(() => {
  const p = ringkasan.value?.presensi_hari_ini
  if (!p) return null
  const total = p.hadir + p.izin + p.sakit + p.tidak_absen
  if (!total) return null
  return { hadir: p.hadir, total, persen: Math.round((p.hadir / total) * 100) }
})

const stats = computed(() => {
  const r = ringkasan.value
  const rataSiswa = r?.total_guru ? Math.round(r.total_siswa / r.total_guru) : null
  return [
    {
      label: 'Total Siswa PKL',
      icon: 'users',
      tone: 'blue',
      value: r?.total_siswa ?? null,
      hint: 'terdaftar di sistem',
    },
    {
      label: 'Guru Pembimbing',
      icon: 'user-check',
      tone: 'blue',
      value: r?.total_guru ?? null,
      hint: rataSiswa !== null ? `rata-rata ${rataSiswa} siswa/guru` : '',
    },
    {
      label: 'Perusahaan Mitra',
      icon: 'building',
      tone: 'amber',
      value: r?.total_perusahaan ?? null,
      hint: perusahaanKuota.value !== null ? `${perusahaanKuota.value} perusahaan kuota masih tersedia` : '',
    },
    {
      label: 'Kehadiran Hari Ini',
      icon: 'calendar-check',
      tone: 'green',
      value: kehadiranHariIni.value ? `${kehadiranHariIni.value.persen}%` : null,
      hint: kehadiranHariIni.value ? `${kehadiranHariIni.value.hadir} dari ${kehadiranHariIni.value.total} siswa` : '',
    },
  ]
})

const pengajuanTerbaru = computed(() => pengajuan.value.slice(0, 5))

const kolomKehadiran = computed(() => {
  const list = kehadiranJurusan.value
  const batas = Math.ceil(list.length / 2)
  return [list.slice(0, batas), list.slice(batas)].filter((k) => k.length)
})

const deskripsiKehadiran = computed(() =>
  kehadiranJurusan.value.length
    ? `Persentase kehadiran minggu ini · ${kehadiranJurusan.value.length} program studi.`
    : 'Persentase kehadiran minggu ini.'
)

const aktivitas = computed(() => {
  const events = []
  for (const p of pengajuan.value) {
    const nama = p.siswa?.nama ?? 'Siswa'
    const usaha = p.perusahaan?.nama ?? 'perusahaan'
    if (p.created_at) {
      events.push({
        key: `c-${p.id}`,
        waktu: p.created_at,
        icon: 'file',
        tone: 'amber',
        kategori: 'Pengajuan',
        judul: 'Pengajuan PKL baru',
        deskripsi: `${nama} → ${usaha}`,
      })
    }
    if (p.verified_at && p.status === 'approved') {
      events.push({
        key: `a-${p.id}`,
        waktu: p.verified_at,
        icon: 'circle-check',
        tone: 'green',
        kategori: 'Pengajuan',
        judul: 'Pengajuan PKL diterima',
        deskripsi: `${nama} → ${usaha}`,
      })
    }
    if (p.verified_at && p.status === 'rejected') {
      events.push({
        key: `r-${p.id}`,
        waktu: p.verified_at,
        icon: 'circle-x',
        tone: 'red',
        kategori: 'Pengajuan',
        judul: 'Pengajuan PKL ditolak',
        deskripsi: `${nama} → ${usaha}`,
      })
    }
  }
  return events.sort((a, b) => new Date(b.waktu) - new Date(a.waktu)).slice(0, 4)
})

const statusMap = {
  pending: { label: 'Menunggu', badge: 'border-yellow-200 bg-yellow-50 text-yellow-700' },
  approved: { label: 'Diterima', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Ditolak', badge: 'border-red-100 bg-red-50 text-red-700' },
}

const tones = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-yellow-50 text-yellow-700',
  red: 'bg-red-50 text-red-700',
}

const toneText = {
  blue: 'text-blue-600',
  green: 'text-emerald-700',
  amber: 'text-yellow-700',
  red: 'text-red-700',
}

const shortcuts = [
  { label: 'Tambah Guru', icon: 'user-plus', tone: 'blue', to: '/admin/master-data/guru/tambah' },
  { label: 'Tambah Siswa', icon: 'cap', tone: 'blue', to: '/admin/master-data/siswa/tambah' },
  { label: 'Export / Import', icon: 'file-text', tone: 'green', to: '/admin/export-import' },
  { label: 'Penempatan', icon: 'pin', tone: 'amber', to: '/admin/lokasi-penempatan' },
  { label: 'Data Master', icon: 'database', tone: 'blue', to: '/admin/data-master' },
  { label: 'Pengaturan', icon: 'settings', tone: 'amber', to: '/admin/pengaturan' },
]

async function loadKehadiranJurusan() {
  const jurusan = await fetchAll('/api/jurusan')

  const now = new Date()
  const senin = new Date(now)
  senin.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const params = { tanggal_mulai: isoLokal(senin), tanggal_selesai: isoLokal(now) }

  const hasil = await Promise.all(
    jurusan.map(async (j) => {
      try {
        const { data } = await api.get('/api/absensi/rekap', { params: { ...params, jurusan_id: j.id } })
        const rows = data.data ?? []
        const hadir = rows.reduce((n, r) => n + r.hadir, 0)
        const total = rows.reduce((n, r) => n + r.hadir + r.izin + r.sakit, 0)
        return { id: j.id, kode: j.kode, nama: j.nama, persen: total ? Math.round((hadir / total) * 100) : null }
      } catch {
        return { id: j.id, kode: j.kode, nama: j.nama, persen: null }
      }
    })
  )

  kehadiranJurusan.value = hasil.sort((a, b) => {
    if (a.persen === null && b.persen === null) return a.kode.localeCompare(b.kode)
    if (a.persen === null) return 1
    if (b.persen === null) return -1
    return a.persen - b.persen
  })
}

onMounted(() => {
  api.get('/api/dashboard/admin')
    .then((res) => {
      ringkasan.value = res.data
    })
    .catch(() => {
      errors.dashboard = true
    })
    .finally(() => {
      loadingRingkasan.value = false
    })

  api.get('/api/gelombang')
    .then((res) => {
      gelombang.value = pilihGelombang(res.data.data ?? [])
    })
    .catch(() => {})
    .finally(() => {
      loadingGelombang.value = false
    })

  api.get('/api/perusahaan', { params: { kuota_tersedia: 1 } })
    .then((res) => {
      perusahaanKuota.value = res.data.meta?.total ?? null
    })
    .catch(() => {})

  api.get('/api/pengajuan-pkl')
    .then((res) => {
      pengajuan.value = res.data.data ?? []
    })
    .catch(() => {
      errors.pengajuan = true
    })
    .finally(() => {
      loading.value = false
    })

  api.get('/api/pengajuan-pkl', { params: { status: 'pending' } })
    .then((res) => {
      pengajuanPending.value = res.data.meta?.total ?? null
    })
    .catch(() => {})

  loadKehadiranJurusan()
    .catch(() => {
      errors.kehadiran = true
    })
    .finally(() => {
      loadingKehadiran.value = false
    })
})

</script>