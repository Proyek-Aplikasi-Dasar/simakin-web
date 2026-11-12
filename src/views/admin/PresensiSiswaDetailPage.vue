<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Presensi Siswa', to: '/admin/presensi-siswa' }, { label: `Detail ${statusInfo.label}` }]"
      :title="`Detail Presensi · ${statusInfo.label}`"
      :subtitle="isBelum ? 'Siswa belum mengirim presensi hari ini.' : 'Rincian presensi harian siswa yang dikirim lewat aplikasi.'"
    >
      <router-link
        to="/admin/presensi-siswa"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </router-link>
      <router-link
        v-if="!loading && !loadError"
        :to="isBelum ? `/admin/presensi-siswa/tambah?siswa_id=${siswaId}&tanggal=${tanggal}` : `/admin/presensi-siswa/${id}/edit`"
        class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <AppIcon name="pencil" class="h-4 w-4" />
        {{ isBelum ? 'Tambah Presensi' : 'Edit Presensi' }}
      </router-link>
    </PageHeader>

    <p v-if="loading" class="py-16 text-center text-sm text-slate-400">Memuat data…</p>
    <div v-else-if="loadError" class="flex flex-col items-center gap-3 py-16 text-center">
      <p class="text-sm text-red-600">{{ loadError }}</p>
      <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">Coba lagi</button>
    </div>

    <div v-else class="flex flex-col gap-6">
      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div class="h-[70px] bg-blue-600"></div>
        <div class="flex items-end justify-between gap-4 px-6 pb-5">
          <div class="flex items-end gap-5">
            <span class="-mt-9 flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-blue-600">
              <AppIcon name="user" class="h-9 w-9" />
            </span>
            <div class="pb-1">
              <h2 class="text-xl font-bold leading-7 tracking-[-0.02em] text-slate-900">{{ siswa?.user?.name ?? '—' }}</h2>
              <p class="text-sm leading-5 text-slate-600">NIS {{ siswa?.nis }}<template v-if="siswa?.kelas"> · {{ siswa.kelas }}</template></p>
            </div>
          </div>
          <span :class="['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', statusInfo.box]">
            <span :class="['h-1.5 w-1.5 rounded-full', statusInfo.dot]" />
            {{ statusInfo.label }}
          </span>
        </div>
        <div class="grid grid-cols-1 gap-6 border-t border-slate-100 px-6 py-5 md:grid-cols-3">
          <InfoItem icon="calendar" label="Tanggal Presensi" :value="tanggalLabel" />
          <InfoItem icon="building" label="Tempat PKL" :value="lokasi?.perusahaan?.nama" />
          <InfoItem icon="user-check" label="Guru Pembimbing" :value="lokasi?.guru?.nama" />
        </div>
      </section>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <div class="flex flex-col gap-6">
          <FormCard title="Informasi Presensi" :description="infoDesc">
            <div v-if="isBelum" class="flex flex-col items-center gap-2 py-8 text-center">
              <span class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <AppIcon name="hourglass" class="h-6 w-6" />
              </span>
              <p class="text-sm font-semibold text-slate-900">Siswa belum mengirim presensi hari ini</p>
              <p class="max-w-md text-xs text-slate-500">Jika siswa berhalangan, admin dapat menambah presensi manual.</p>
            </div>
            <div v-else class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <InfoItem icon="arrow-right" label="Waktu Kirim Presensi" :value="jamKirim" />
              <InfoItem icon="calendar-check" label="Status Kehadiran" :value="statusInfo.label" />
              <InfoItem icon="pin" label="Alamat Perusahaan" :value="perusahaan?.alamat" />
              <InfoItem v-if="absensi.keterangan" icon="file" label="Keterangan" :value="absensi.keterangan" />
              <InfoItem v-if="absensi.korektor" icon="pencil" label="Dikoreksi Oleh" :value="absensi.korektor.name" />
            </div>
          </FormCard>

          <FormCard
            v-if="!isBelum"
            title="Lokasi Presensi"
            description="Lingkaran biru: perusahaan beserta radius. Titik: lokasi siswa saat mengirim presensi."
          >
            <div class="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1fr]">
              <div class="flex flex-col gap-3">
                <div v-if="adaPeta" class="flex gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                  <button
                    v-for="t in tabPeta"
                    :key="t.key"
                    type="button"
                    :disabled="!t.ada"
                    :class="[
                      'flex-1 rounded-lg px-3 py-1.5 transition',
                      pilihPeta === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 disabled:opacity-40',
                    ]"
                    @click="pilihPeta = t.key"
                  >
                    {{ t.label }}
                  </button>
                </div>
                <div v-if="adaPeta" ref="mapEl" class="isolate h-[260px] w-full overflow-hidden rounded-2xl bg-slate-100"></div>
                <div v-else class="flex h-[260px] flex-col items-center justify-center gap-3 rounded-2xl bg-slate-100 p-4 text-center">
                  <span class="flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-600">
                    <AppIcon name="pin" class="h-6 w-6" />
                  </span>
                  <p class="text-xs text-slate-500">Koordinat tidak tersedia.</p>
                </div>
                <div v-if="adaPeta" class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-blue-600/40 ring-1 ring-blue-600"></span>Radius {{ RADIUS_PRESENSI_METER }} m</span>
                  <span v-if="koordKirim" class="inline-flex items-center gap-1.5">
                    <span :class="['h-2.5 w-2.5 rounded-full', dalamRadius ? 'bg-emerald-700' : 'bg-red-700']"></span>Lokasi siswa
                  </span>
                </div>
                <a v-if="mapsUrl" :href="mapsUrl" target="_blank" rel="noopener" class="text-xs font-semibold text-blue-600 hover:underline">
                  Buka di Google Maps
                </a>
              </div>

              <div class="flex flex-col gap-4">
                <span
                  v-if="jarak != null"
                  :class="[
                    'inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4',
                    dalamRadius ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-red-100 bg-red-50 text-red-700',
                  ]"
                >
                  <span :class="['h-1.5 w-1.5 rounded-full', dalamRadius ? 'bg-emerald-700' : 'bg-red-700']" />
                  {{ dalamRadius ? 'Di dalam radius' : 'Di luar radius' }}
                </span>
                <InfoItem icon="building" label="Perusahaan" :value="lokasi?.perusahaan?.nama" />
                <InfoItem icon="crosshair" label="Radius Presensi" :value="`${RADIUS_PRESENSI_METER} meter`" />
                <InfoItem icon="pin" label="Lokasi Kirim Siswa" :value="koordinatSiswa" />
                <InfoItem icon="crosshair" label="Jarak ke Perusahaan" :value="formatJarak(jarak)" />
              </div>
            </div>
          </FormCard>
        </div>

        <aside>
          <section v-if="status === 'libur'" class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-100 px-5 py-4">
            <AppIcon name="alert" class="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            <div>
              <p class="text-sm font-semibold text-slate-900">Tanpa foto</p>
              <p class="text-xs text-slate-600">Presensi libur tidak memerlukan keterangan tambahan.</p>
            </div>
          </section>

          <FormCard v-else :title="fotoTitle" :description="fotoDesc">
            <img v-if="foto" :src="foto" alt="" class="max-h-[360px] w-full rounded-2xl bg-slate-100 object-cover" />
            <div v-else class="flex h-[200px] flex-col items-center justify-center gap-2 rounded-2xl bg-slate-100 text-center">
              <AppIcon name="smartphone" class="h-6 w-6 text-slate-400" />
              <p class="text-sm font-semibold text-slate-900">{{ isBelum ? 'Belum ada foto selfie' : 'Tidak ada foto' }}</p>
              <p v-if="isBelum" class="px-6 text-xs text-slate-500">Foto muncul setelah siswa mengirim presensi.</p>
            </div>
            <p v-if="!isBelum && waktuFoto" class="mt-3 text-center text-xs text-slate-500">{{ waktuFoto }}</p>
            <a
              v-if="foto"
              :href="foto"
              target="_blank"
              rel="noopener"
              class="mt-3 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50"
            >
              <AppIcon name="download" class="h-4 w-4" />
              Buka foto
            </a>
          </FormCard>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useRoute } from 'vue-router'
import api, { getErrorMessage } from '../../services/api'
import { pickLokasi, formatDate, hariName, jamOnly } from '../../utils/siswa'
import { PRESENSI_STATUS, fotoUrl, jarakMeter, formatJarak } from '../../utils/presensi'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import InfoItem from '../../components/InfoItem.vue'
import AppIcon from '../../components/AppIcon.vue'

const RADIUS_PRESENSI_METER = 100

const props = defineProps({ id: { type: [String, Number], default: null }, siswaId: { type: [String, Number], default: null } })
const route = useRoute()

const loading = ref(true)
const loadError = ref('')
const absensi = ref(null)
const siswa = ref(null)
const lokasi = ref(null)
const perusahaan = ref(null)
const waktuAbsen = ref(null) 

const isBelum = computed(() => !props.id)
const status = computed(() => (isBelum.value ? 'belum' : absensi.value?.status ?? 'belum'))
const statusInfo = computed(() => PRESENSI_STATUS[status.value] ?? PRESENSI_STATUS.belum)
const tanggal = computed(() => (isBelum.value ? route.query.tanggal : absensi.value?.tanggal))
const tanggalLabel = computed(() => (tanggal.value ? `${hariName(tanggal.value)}, ${formatDate(tanggal.value)}` : '—'))

const infoDesc = computed(() =>
  waktuAbsen.value
    ? `Presensi dikirim satu kali per hari (dibuka ${waktuAbsen.value.mulai} – ${waktuAbsen.value.selesai}).`
    : 'Presensi dikirim satu kali per hari.'
)

const jamKirim = computed(() => (absensi.value?.jam_masuk ? `${jamOnly(absensi.value.jam_masuk)} WIB` : ''))
const waktuFoto = computed(() => {
  if (!tanggal.value) return ''
  return jamKirim.value ? `${formatDate(tanggal.value)}, ${jamKirim.value}` : formatDate(tanggal.value)
})

const foto = computed(() => fotoUrl(absensi.value?.foto_masuk))
const fotoTitle = computed(() => (status.value === 'izin' || status.value === 'sakit' ? 'Foto Lampiran' : 'Foto Selfie'))
const fotoDesc = computed(() =>
  status.value === 'izin' || status.value === 'sakit' ? 'Dilampirkan siswa saat mengirim presensi.' : 'Diambil saat mengirim presensi.'
)

const lat = computed(() => absensi.value?.latitude)
const lng = computed(() => absensi.value?.longitude)
const hasKoordinat = computed(() => lat.value != null && lng.value != null)
const koordinatSiswa = computed(() => (hasKoordinat.value ? `${Number(lat.value).toFixed(4)}, ${Number(lng.value).toFixed(4)}` : ''))

const jarak = computed(() => jarakMeter(lat.value, lng.value, perusahaan.value?.latitude, perusahaan.value?.longitude))
const dalamRadius = computed(() => jarak.value != null && jarak.value <= RADIUS_PRESENSI_METER)

const pilihPeta = ref('semua') 
const mapEl = ref(null)
let map = null

const koordPerusahaan = computed(() => {
  const p = perusahaan.value
  return p?.latitude != null && p?.longitude != null ? [Number(p.latitude), Number(p.longitude)] : null
})
const koordKirim = computed(() => (hasKoordinat.value ? [Number(lat.value), Number(lng.value)] : null))
const adaPeta = computed(() => !!(koordKirim.value || koordPerusahaan.value))
const tabPeta = computed(() => [
  { key: 'semua', label: 'Semua', ada: !!(koordKirim.value && koordPerusahaan.value) },
  { key: 'perusahaan', label: 'Perusahaan', ada: !!koordPerusahaan.value },
  { key: 'siswa', label: 'Lokasi Siswa', ada: !!koordKirim.value },
])
const mapsUrl = computed(() => {
  const k = pilihPeta.value === 'perusahaan' ? koordPerusahaan.value || koordKirim.value : koordKirim.value || koordPerusahaan.value
  return k ? `https://www.google.com/maps?q=${k[0]},${k[1]}` : ''
})

function fokus() {
  if (!map) return
  const pusat = koordPerusahaan.value
  const siswaPos = koordKirim.value
  const batasLingkaran = pusat ? L.latLng(pusat).toBounds(RADIUS_PRESENSI_METER * 2) : null
  let batas = null
  if (pilihPeta.value === 'perusahaan') batas = batasLingkaran
  else if (pilihPeta.value === 'siswa') batas = null
  else batas = batasLingkaran ? (siswaPos ? batasLingkaran.extend(siswaPos) : batasLingkaran) : null

  if (batas) map.fitBounds(batas, { padding: [24, 24], maxZoom: 18 })
  else if (siswaPos) map.setView(siswaPos, 17)
  else if (pusat) map.setView(pusat, 17)
}

function initMap() {
  if (map) {
    map.remove()
    map = null
  }
  if (!adaPeta.value || !mapEl.value) return

  map = L.map(mapEl.value, { scrollWheelZoom: false, attributionControl: false })
  L.control.attribution({ prefix: false }).addTo(map)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map)

  const namaPerusahaan = lokasi.value?.perusahaan?.nama ?? 'Perusahaan'
  if (koordPerusahaan.value) {
    L.circle(koordPerusahaan.value, {
      radius: RADIUS_PRESENSI_METER,
      color: '#2563eb',
      fillColor: '#2563eb',
      fillOpacity: 0.25,
      weight: 2,
    })
      .addTo(map)
      .bindTooltip(`${namaPerusahaan} (radius ${RADIUS_PRESENSI_METER} m)`)
    L.circleMarker(koordPerusahaan.value, { radius: 6, color: '#fff', weight: 2, fillColor: '#2563eb', fillOpacity: 1 })
      .addTo(map)
      .bindTooltip(namaPerusahaan)
  }
  if (koordKirim.value) {
    L.circleMarker(koordKirim.value, {
      radius: 8,
      color: '#fff',
      weight: 2,
      fillColor: dalamRadius.value ? '#047857' : '#b91c1c',
      fillOpacity: 1,
    })
      .addTo(map)
      .bindTooltip('Lokasi kirim siswa')
  }

  fokus()
  setTimeout(() => map?.invalidateSize(), 100)
}

watch(pilihPeta, fokus)
onBeforeUnmount(() => {
  if (map) map.remove()
})

async function loadWaktuAbsen() {
  try {
    const res = await api.get('/api/waktu-absen')
    const row = res.data?.data?.[0]
    if (row?.mulai && row?.selesai) waktuAbsen.value = { mulai: row.mulai, selesai: row.selesai }
  } catch {
  }
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    let sid = props.siswaId
    if (props.id) {
      const res = await api.get(`/api/absensi/${props.id}`)
      absensi.value = res.data.data
      sid = absensi.value.siswa_id
    }
    const [s, l] = await Promise.all([api.get(`/api/siswa/${sid}`), api.get(`/api/siswa/${sid}/lokasi-pkl`), loadWaktuAbsen()])
    siswa.value = s.data.data
    lokasi.value = pickLokasi(l.data.data)
    if (lokasi.value?.perusahaan?.id) {
      perusahaan.value = (await api.get(`/api/perusahaan/${lokasi.value.perusahaan.id}`)).data.data
    }
  } catch (e) {
    loadError.value = getErrorMessage(e, 'Gagal memuat detail presensi.')
  } finally {
    loading.value = false
  }
  await nextTick()
  initMap()
}

onMounted(load)
</script>


<style>
.leaflet-control-attribution {
  font-size: 10px !important;
  background: rgba(255, 255, 255, 0.7) !important;
}
</style>