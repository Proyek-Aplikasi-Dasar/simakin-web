<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Utama' }, { label: 'Dashboard' }]"
      :title="`Selamat ${waktu}, ${auth.user?.name ?? ''}`"
      subtitle="Ringkasan aktivitas PKL siswa bimbingan hari ini."
    >
      <!-- belum ada endpoint rekap per guru -->
      <span
        title="Segera hadir"
        class="flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold leading-5 text-slate-900 opacity-50"
      >
        <AppIcon name="download" class="h-5 w-5" />
        Unduh Rekap
      </span>
      <!-- nilai akhir belum ada endpoint -->
      <span
        title="Segera hadir"
        class="flex cursor-not-allowed items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold leading-5 text-white opacity-50"
      >
        <AppIcon name="clipboard-check" class="h-5 w-5" />
        Input Nilai Akhir
      </span>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section
        class="relative flex flex-col items-start gap-4 overflow-hidden rounded-3xl bg-blue-600 px-5 py-5 text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.35)] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8 sm:py-6"
      >
        <div class="absolute -top-[120px] left-[820px] h-[260px] w-[260px] rounded-full bg-blue-700"></div>
        <div class="absolute left-[960px] top-[40px] h-[180px] w-[180px] rounded-full bg-blue-700"></div>
        <div class="absolute left-[60px] top-[70px] h-[120px] w-[120px] rounded-full bg-blue-700"></div>

        <div class="relative flex min-w-0 flex-col gap-2">
          <span v-if="loading" class="block h-6 w-64 max-w-full animate-pulse rounded-full bg-white/25"></span>
          <span
            v-else-if="periode"
            class="inline-flex w-fit items-center gap-1.5 rounded-full bg-yellow-400 px-2.5 py-1 text-[11px] font-semibold leading-[14px] text-slate-900"
          >
            <AppIcon name="calendar" class="h-3.5 w-3.5" />
            {{ periode.label }}
          </span>

          <span v-if="loading" class="my-1 block h-5 w-72 max-w-full animate-pulse rounded bg-white/25"></span>
          <h2 v-else class="text-xl font-semibold leading-[30px] tracking-[-0.02em]">{{ bannerTitle }}</h2>
          <p class="text-xs leading-[18px] text-blue-200">
            Jurnal langsung tercatat tanpa persetujuan. Pantau dan ingatkan siswa lewat chat.
          </p>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <div class="h-2 w-full overflow-hidden rounded-full bg-white sm:w-80">
              <div
                class="h-full rounded-full bg-yellow-400 transition-all duration-500"
                :style="{ width: `${periode?.persen ?? 0}%` }"
              ></div>
            </div>
            <span v-if="loading" class="block h-3 w-44 animate-pulse rounded bg-white/25"></span>
            <span v-else class="text-[11px] font-medium leading-[14px]">
              {{ periode ? `${periode.persen}% periode PKL berjalan` : 'Data periode PKL belum tersedia' }}
            </span>
          </div>
        </div>

        <!-- jurnal belum ada endpoint -->
        <span
          title="Segera hadir"
          class="relative flex shrink-0 cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold leading-5 text-slate-900 opacity-60"
        >
          <AppIcon name="file-text" class="h-5 w-5" />
          Lihat Jurnal
        </span>
      </section>

      <section class="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" :loading="loading" />
      </section>

      <!-- token penilaian belum ada endpoint, dikosongin dulu -->
      <section class="flex flex-wrap items-center gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-white px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <AppIcon name="key-round" class="h-[22px] w-[22px]" />
        </span>
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 class="text-base font-semibold leading-6 tracking-[-0.02em] text-slate-900">Token Penilaian {{ bulanLabel }}</h2>
          <p class="text-xs leading-[18px] text-slate-500">Berikan kode ini ke pembimbing industri. Pengisian tanggal 1 – 10.</p>
        </div>
        <div class="flex gap-1.5 sm:gap-2" role="img" aria-label="Token penilaian belum tersedia" title="Token belum tersedia">
          <span
            v-for="i in 6"
            :key="i"
            class="flex h-11 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xl font-semibold leading-[30px] tracking-[-0.02em] text-slate-300 sm:h-[52px] sm:w-11"
          >
            —
          </span>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_352px]">
        <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <CardHeader
            title="Kehadiran Hari Ini"
            :description="`Presensi siswa bimbingan, ${tanggalLabel}.`"
            action="Lihat semua"
            to="/guru/presensi-siswa"
          />

          <div class="hidden items-center gap-4 border-t border-slate-100 bg-slate-100 px-6 py-2.5 sm:flex">
            <span class="flex-1 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Nama Siswa</span>
            <span class="w-[170px] text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Perusahaan</span>
            <span class="w-[80px] whitespace-nowrap text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Waktu Kirim</span>
            <span class="w-[128px] text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Status</span>
            <span class="w-10"></span>
          </div>

          <SkeletonRows v-if="loading" :rows="4" :cols="4" />
          <div v-else-if="error" class="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p class="text-sm text-red-600">{{ error }}</p>
            <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">
              Coba lagi
            </button>
          </div>
          <p v-else-if="!presensiTampil.length" class="px-6 py-12 text-center text-sm text-slate-400">
            Belum ada siswa bimbingan aktif.
          </p>
          <ul v-else>
            <li
              v-for="row in presensiTampil"
              :key="row.siswaId"
              class="flex items-center gap-3 border-t border-slate-100 px-4 py-3 first:border-t-0 sm:gap-4 sm:px-6"
            >
              <div class="flex min-w-0 flex-1 items-center gap-2.5">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <AppIcon name="user" class="h-5 w-5" />
                </span>
                <div class="min-w-0">
                  <p class="truncate text-xs font-semibold leading-[18px] text-slate-900">{{ row.nama }}</p>
                  <p class="truncate text-[11px] leading-[14px] text-slate-500">{{ row.kelas || '—' }}</p>
                  <p class="truncate text-[11px] leading-[14px] text-slate-500 sm:hidden">{{ row.perusahaan }} · {{ row.jam }}</p>
                </div>
              </div>

              <p class="hidden w-[170px] truncate text-xs leading-[18px] text-slate-600 sm:block" :title="row.perusahaan">{{ row.perusahaan }}</p>
              <p class="hidden w-[80px] text-xs leading-[18px] text-slate-600 sm:block">{{ row.jam }}</p>

              <div class="shrink-0 sm:w-[128px]">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4',
                    PRESENSI_STATUS[row.status].box,
                  ]"
                >
                  <span :class="['h-1.5 w-1.5 rounded-full', PRESENSI_STATUS[row.status].dot]"></span>
                  {{ PRESENSI_STATUS[row.status].label }}
                </span>
              </div>

              <router-link
                :to="`/guru/presensi-siswa/siswa/${row.siswaId}`"
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Lihat riwayat presensi"
                title="Lihat riwayat presensi"
              >
                <AppIcon name="eye" class="h-5 w-5" />
              </router-link>
            </li>
          </ul>
        </section>

        <!-- notifikasi belum ada endpoint -->
        <section class="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <CardHeader title="Notifikasi" action="Tandai dibaca" />
          <p class="flex-1 px-6 py-12 text-center text-sm text-slate-400">Belum ada notifikasi.</p>
          <div class="flex justify-center px-6 py-4">
            <span
              title="Segera hadir"
              class="flex cursor-not-allowed items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold leading-4 text-blue-600 opacity-50"
            >
              <AppIcon name="arrow-right" class="h-4 w-4" />
              Lihat semua notifikasi
            </span>
          </div>
        </section>
      </div>

      <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_352px]">
        <!-- jurnal belum ada endpoint -->
        <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <CardHeader title="Jurnal Terbaru" description="Aktivitas harian yang dikirim siswa." action="Lihat semua" />

          <div class="hidden items-center gap-4 border-t border-slate-100 bg-slate-100 px-6 py-2.5 sm:flex">
            <span class="flex-1 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Siswa &amp; Kegiatan</span>
            <span class="w-[100px] text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Tanggal</span>
            <span class="w-[128px] text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Status</span>
            <span class="w-10"></span>
          </div>
          <p class="px-6 py-12 text-center text-sm text-slate-400">Data jurnal belum tersedia.</p>
        </section>

        <section class="flex flex-col self-stretch overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <CardHeader
            title="Ringkasan Presensi"
            :description="`Minggu ini · ${ringkasan ? ringkasan.aktif : 0} siswa aktif`"
          />

          <ul v-if="loading" class="flex flex-col gap-4 px-6 py-1" role="status" aria-busy="true" aria-label="Memuat data">
            <li v-for="i in 4" :key="i" class="flex flex-col gap-1.5">
              <span class="h-3 w-full animate-pulse rounded bg-slate-200"></span>
              <span class="h-2 w-full animate-pulse rounded-full bg-slate-100"></span>
            </li>
          </ul>
          <ul v-else-if="barMingguan.length" class="flex flex-col gap-4 px-6 py-1">
            <li v-for="b in barMingguan" :key="b.key" class="flex flex-col gap-1.5">
              <div class="flex items-start justify-between">
                <span class="flex items-center gap-2 text-xs font-medium leading-[18px] text-slate-600">
                  <span :class="['h-2 w-2 rounded-full', b.warna]"></span>
                  {{ b.label }}
                </span>
                <span class="text-xs font-semibold leading-[18px] text-slate-900">{{ b.jumlah }} · {{ b.persen }}%</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div :class="['h-full rounded-full transition-all duration-500', b.warna]" :style="{ width: `${b.persen}%` }"></div>
              </div>
            </li>
          </ul>
          <p v-else class="px-6 py-12 text-center text-sm text-slate-400">
            {{ error ? 'Gagal memuat data presensi.' : 'Belum ada data presensi minggu ini.' }}
          </p>
          <div class="h-4"></div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api, { getErrorMessage } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { fetchAllPages, parseDate, toIso, formatDate, hariName, jamOnly, rentangEfektif, hitungEfektif } from '../../utils/siswa'
import { PRESENSI_STATUS } from '../../utils/presensi'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'
import SkeletonRows from '../../components/SkeletonRows.vue'

const HARI_MS = 24 * 60 * 60 * 1000

const auth = useAuthStore()

const waktu = computed(() => {
  const jam = new Date().getHours()
  if (jam < 11) return 'pagi'
  if (jam < 15) return 'siang'
  if (jam < 18) return 'sore'
  return 'malam'
})

const today = toIso(new Date())
const tanggalLabel = `${hariName(today)} ${formatDate(today)}`
const bulanLabel = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

const loading = ref(true)
const error = ref('')
const ringkasan = ref(null) // { total, aktif, belumMulai, perusahaan }
const presensiRows = ref([])
const mingguan = ref(null) // { hadir, sakit, izin, belum }
const gelombang = ref(null)

// username guru = NIP, dicocokin ke guru.nip di lokasi PKL
// /api/user ga ada id guru, jadi diambil dari lokasi PKL
async function load() {
  loading.value = true
  error.value = ''
  try {
    const nip = auth.user?.username
    if (!nip) throw new Error('Data akun guru tidak ditemukan.')

    const [lokasiAll, siswa] = await Promise.all([fetchAllPages('/api/lokasi-pkl'), fetchAllPages('/api/siswa')])
    const kelasById = new Map(siswa.map((s) => [s.id, s.kelas]))

    // 1 lokasi per siswa: active > pending > completed, cancelled skip
    const urutan = { active: 3, pending: 2, completed: 1 }
    const perSiswa = new Map()
    for (const l of lokasiAll) {
      if (l.guru?.nip !== nip || !urutan[l.status] || !l.siswa?.id) continue
      const lama = perSiswa.get(l.siswa.id)
      const lebihBaik =
        !lama || urutan[l.status] > urutan[lama.status] || (urutan[l.status] === urutan[lama.status] && l.id > lama.id)
      if (lebihBaik) perSiswa.set(l.siswa.id, l)
    }
    const daftar = [...perSiswa.values()]
    const aktif = daftar.filter((l) => l.status === 'active')

    ringkasan.value = {
      total: daftar.length,
      aktif: aktif.length,
      belumMulai: daftar.filter((l) => l.status === 'pending').length,
      perusahaan: new Set(daftar.map((l) => l.perusahaan?.id).filter(Boolean)).size,
    }

    if (!aktif.length) {
      presensiRows.value = []
      mingguan.value = null
      gelombang.value = null
      return
    }

    const guruId = aktif[0].guru.id
    const gelombangId = aktif[0].gelombang?.id
    const senin = new Date()
    senin.setDate(senin.getDate() - ((senin.getDay() + 6) % 7))
    const awalMinggu = toIso(senin)

    const [bimbingan, rekap, gel] = await Promise.all([
      api.get(`/api/guru/${guruId}/siswa-bimbingan`, { params: { tanggal: today } }),
      // rekap BE isinya semua siswa, difilter di bawah
      api.get('/api/absensi/rekap', { params: { tanggal_mulai: awalMinggu, tanggal_selesai: today } }),
      gelombangId ? api.get(`/api/gelombang/${gelombangId}`).catch(() => null) : null,
    ])

    presensiRows.value = (bimbingan.data.data ?? [])
      .map((r) => ({
        siswaId: r.siswa.id,
        nama: r.siswa.nama ?? '—',
        kelas: kelasById.get(r.siswa.id) ?? '',
        perusahaan: r.perusahaan ?? '—',
        status: r.presensi_hari_ini?.status ?? 'belum',
        jam: r.presensi_hari_ini ? jamOnly(r.presensi_hari_ini.jam_masuk) : '—',
      }))
      .sort((a, b) => a.nama.localeCompare(b.nama))

    // hari tanpa presensi = belum presensi (BE ga punya status alpa)
    const rekapMap = new Map((rekap.data.data ?? []).map((r) => [r.siswa?.id, r]))
    const m = { hadir: 0, sakit: 0, izin: 0, belum: 0 }
    for (const l of aktif) {
      const r = rekapMap.get(l.siswa.id)
      const c = { hadir: r?.hadir ?? 0, izin: r?.izin ?? 0, sakit: r?.sakit ?? 0, libur: r?.libur ?? 0 }
      const rentang = rentangEfektif(awalMinggu, today, l)
      const efektif = hitungEfektif(c, rentang.from, rentang.to)
      m.hadir += c.hadir
      m.sakit += c.sakit
      m.izin += c.izin
      m.belum += efektif - c.hadir - c.izin - c.sakit
    }
    mingguan.value = m

    gelombang.value = gel?.data?.data ?? null
  } catch (e) {
    console.error('Dashboard guru gagal dimuat:', e)
    error.value = e.message === 'Data akun guru tidak ditemukan.' ? e.message : getErrorMessage(e, 'Gagal memuat data dashboard.')
  } finally {
    loading.value = false
  }
}

const periode = computed(() => {
  const g = gelombang.value
  if (!g) return null
  const mulai = parseDate(g.praktik_mulai)
  const selesai = parseDate(g.praktik_selesai)
  const hariIni = parseDate(today)
  const totalMinggu = Math.max(1, Math.ceil((selesai - mulai + HARI_MS) / (7 * HARI_MS)))

  if (hariIni < mulai) return { label: `${g.nama} · Belum dimulai`, persen: 0 }
  if (hariIni > selesai) return { label: `${g.nama} · Selesai`, persen: 100 }

  const ke = Math.min(totalMinggu, Math.floor((hariIni - mulai) / (7 * HARI_MS)) + 1)
  const persen = Math.round(((hariIni - mulai + HARI_MS) / (selesai - mulai + HARI_MS)) * 100)
  return { label: `${g.nama} · Minggu ke-${ke} dari ${totalMinggu}`, persen }
})

const jumlahHadir = computed(() => presensiRows.value.filter((r) => r.status === 'hadir').length)
const jumlahBelum = computed(() => presensiRows.value.filter((r) => r.status === 'belum').length)

// jurnal belum ada endpoint, banner ikut data presensi
const bannerTitle = computed(() => {
  if (!presensiRows.value.length) return 'Belum ada siswa bimbingan aktif'
  return jumlahBelum.value > 0
    ? `${jumlahBelum.value} siswa belum presensi hari ini`
    : 'Semua siswa sudah presensi hari ini'
})

const stats = computed(() => {
  const r = ringkasan.value
  const n = presensiRows.value.length
  return [
    {
      label: 'Total Siswa Bimbingan',
      icon: 'users',
      tone: 'blue',
      value: r ? r.total : null,
      hint: r ? `di ${r.perusahaan} perusahaan mitra` : '',
    },
    {
      label: 'Hadir Hari Ini',
      icon: 'user-check',
      tone: 'green',
      value: r ? jumlahHadir.value : null,
      hint: n ? `${Math.round((jumlahHadir.value / n) * 100)}% dari siswa aktif PKL` : 'belum ada siswa aktif',
    },
    // jurnal belum ada endpoint, kartu kosong
    { label: 'Belum Mengisi Jurnal', icon: 'file-text', tone: 'amber', value: null, hint: '' },
    {
      label: 'Siswa Aktif PKL',
      icon: 'briefcase',
      tone: 'blue',
      value: r ? r.aktif : null,
      hint: r ? `${r.belumMulai} siswa belum mulai` : '',
    },
  ]
})

const presensiTampil = computed(() => presensiRows.value.slice(0, 4))

const barMingguan = computed(() => {
  const m = mingguan.value
  if (!m) return []
  const total = m.hadir + m.sakit + m.izin + m.belum
  if (!total) return []
  const persen = (n) => Math.round((n / total) * 100)
  return [
    { key: 'hadir', label: 'Hadir', jumlah: m.hadir, persen: persen(m.hadir), warna: 'bg-emerald-700' },
    { key: 'sakit', label: 'Sakit', jumlah: m.sakit, persen: persen(m.sakit), warna: 'bg-yellow-700' },
    { key: 'izin', label: 'Izin', jumlah: m.izin, persen: persen(m.izin), warna: 'bg-blue-700' },
    { key: 'belum', label: 'Belum Presensi', jumlah: m.belum, persen: persen(m.belum), warna: 'bg-red-700' },
  ]
})

onMounted(load)
</script>
