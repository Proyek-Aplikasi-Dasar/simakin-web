<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Pengajuan PKL', to: backTo }, { label: isPending ? 'Verifikasi' : 'Detail' }]"
      :title="isPending ? 'Verifikasi Pengajuan PKL' : 'Detail Pengajuan PKL'"
      :subtitle="
        isPending
          ? 'Tinjau tempat PKL yang dipilih siswa dari daftar perusahaan.'
          : 'Rincian tempat PKL yang dipilih siswa dan hasil verifikasinya.'
      "
    >
      <router-link
        :to="backTo"
        class="flex h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-5 w-5 text-slate-600" />
        Kembali
      </router-link>
    </PageHeader>

    <p v-if="loading" class="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-400">
      Memuat data...
    </p>
    <p v-else-if="loadError" class="rounded-lg bg-red-50 p-3 text-xs text-red-600">{{ loadError }}</p>

    <div v-else class="flex flex-col gap-6">
      <section class="relative overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div class="absolute inset-x-0 top-0 h-14 overflow-hidden bg-blue-600">
          <span class="absolute -top-[90px] left-[900px] h-[180px] w-[180px] rounded-full bg-blue-700"></span>
          <span class="absolute left-[1010px] top-2.5 h-[120px] w-[120px] rounded-full bg-blue-700"></span>
        </div>

        <div class="relative flex items-end gap-6 px-6 pb-5 pt-7">
          <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white p-1">
            <div class="flex h-full w-full items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <AppIcon name="user" class="h-9 w-9" />
            </div>
          </div>

          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <h2 class="truncate text-lg font-semibold leading-[26px] text-slate-900">{{ data.siswa?.nama || '—' }}</h2>
            <p class="text-xs leading-[18px] text-slate-500">{{ siswaSubline }}</p>
          </div>

          <span
            :class="[
              'inline-flex shrink-0 items-center gap-1.5 self-end rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4',
              status.box,
            ]"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
            {{ isPending ? 'Menunggu Verifikasi' : status.label }}
          </span>
        </div>
      </section>

      <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <FormCard title="Perusahaan yang Dipilih" description="Pilihan siswa dari daftar perusahaan di aplikasi.">
          <div class="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
            <InfoItem icon="building" label="Nama Perusahaan" :value="data.perusahaan?.nama" />
            <InfoItem icon="pin" label="Alamat" :value="perusahaan.alamat" />
            <InfoItem icon="user" label="Pimpinan" :value="perusahaan.pimpinan" />
            <InfoItem icon="smartphone" label="Kontak" :value="perusahaan.telp" />
            <InfoItem icon="calendar" label="Periode" :value="periode" />
            <InfoItem icon="briefcase" label="Kuota Tersisa" :value="kuotaTersisa" />
            <InfoItem icon="calendar-check" label="Tanggal Pengajuan" :value="formatWaktu(data.created_at)" />
            <InfoItem icon="clipboard-list" label="Gelombang" :value="gelombangLabel" />
          </div>
        </FormCard>

        <FormCard
          v-if="isPending"
          title="Keputusan"
          description="Hasil verifikasi dikirim ke aplikasi siswa."
        >
          <form class="flex flex-col gap-5" novalidate @submit.prevent="submit">
            <div role="radiogroup" aria-label="Keputusan" class="flex flex-col gap-2">
              <label
                v-for="o in decisionOptions"
                :key="o.value"
                :class="[
                  'flex cursor-pointer items-center gap-2.5 rounded-xl px-4 py-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-300',
                  decision === o.value ? 'border-[1.5px] border-blue-600 bg-blue-50' : 'border border-slate-200 bg-white',
                ]"
              >
                <input v-model="decision" type="radio" name="decision" :value="o.value" class="sr-only" />
                <span
                  :class="[
                    'h-[18px] w-[18px] shrink-0 rounded-full bg-white',
                    decision === o.value ? 'border-[5px] border-blue-600' : 'border-[1.5px] border-slate-300',
                  ]"
                ></span>
                <span :class="['text-sm font-semibold', decision === o.value ? 'text-blue-600' : 'text-slate-600']">
                  {{ o.label }}
                </span>
              </label>
            </div>

            <FormField
              id="guru"
              v-model="guruId"
              label="Guru Pembimbing"
              placeholder="Pilih guru pembimbing"
              :options="guruOptions"
              :disabled="decision !== 'approve' || !guruOptions.length"
              :error="errors.guru"
              :hint="guruHint"
            />

            <FormField
              id="catatan"
              v-model="alasan"
              textarea
              :rows="5"
              :label="decision === 'reject' ? 'Alasan Penolakan' : 'Catatan untuk Siswa'"
              :placeholder="decision === 'reject' ? 'Tulis alasan penolakan untuk siswa' : 'Catatan hanya dikirim saat pengajuan ditolak'"
              :disabled="decision !== 'reject'"
              :error="errors.alasan"
              :hint="decision === 'reject' ? 'Wajib diisi, maksimal 1000 karakter.' : ''"
            />

            <button
              type="submit"
              :disabled="saving"
              :class="[
                'flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60',
                decision === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700',
              ]"
            >
              <AppIcon name="save" class="h-5 w-5" />
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </form>
        </FormCard>

        <FormCard v-else title="Hasil Verifikasi" description="Keputusan yang sudah dikirim ke siswa.">
          <div class="flex flex-col gap-5">
            <InfoItem icon="circle-check" label="Keputusan" :value="status.label" />
            <InfoItem icon="calendar-check" label="Diproses Pada" :value="formatWaktu(data.verified_at)" />
            <InfoItem
              v-if="data.status === 'approved'"
              icon="user-check"
              label="Guru Pembimbing"
              :value="guruTerpilih"
              :hint="guruTerpilih ? '' : 'Belum ditentukan'"
            />
            <div v-if="data.status === 'rejected'" class="flex flex-col gap-1.5">
              <p class="text-[10px] font-semibold uppercase leading-4 tracking-[0.06em] text-slate-500">Alasan Penolakan</p>
              <p class="whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                {{ data.alasan_penolakan || '—' }}
              </p>
            </div>
          </div>
        </FormCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api, { getErrorMessage } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import { fetchAllPages, formatDate } from '../../utils/siswa'
import { PENGAJUAN_STATUS, formatWaktu } from '../../utils/pengajuan'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import InfoItem from '../../components/InfoItem.vue'
import AppIcon from '../../components/AppIcon.vue'

const props = defineProps({
  id: { type: String, required: true },
})

const router = useRouter()
const toast = useToastStore()
const backTo = '/admin/pengajuan-pkl'

const loading = ref(true)
const loadError = ref('')
const data = ref({})
const siswa = ref({})
const perusahaan = ref({})
const gelombang = ref(null)
const lokasiList = ref([])
const guruList = ref([])

const decision = ref('approve')
const guruId = ref('')
const alasan = ref('')
const saving = ref(false)
const errors = reactive({ guru: '', alasan: '' })

const decisionOptions = [
  { value: 'approve', label: 'Terima pengajuan' },
  { value: 'reject', label: 'Tolak pengajuan' },
]

const isPending = computed(() => data.value.status === 'pending')
const status = computed(() => PENGAJUAN_STATUS[data.value.status] ?? PENGAJUAN_STATUS.pending)

const siswaSubline = computed(() => {
  const s = data.value.siswa
  const kelas = siswa.value.kelas || s?.jurusan?.kode || s?.jurusan?.nama
  return [s?.nis ? `NIS ${s.nis}` : null, kelas, `diajukan ${formatWaktu(data.value.created_at)}`]
    .filter(Boolean)
    .join(' · ')
})

const periode = computed(() =>
  gelombang.value
    ? `${formatDate(gelombang.value.praktik_mulai)} – ${formatDate(gelombang.value.praktik_selesai)}`
    : ''
)

const gelombangLabel = computed(() =>
  [data.value.gelombang?.nama, data.value.gelombang?.tahun_ajaran].filter(Boolean).join(' · ')
)

const kuotaTersisa = computed(() => {
  const kuota = perusahaan.value.kuota
  if (kuota == null) return perusahaan.value.id ? 'Tanpa batas' : ''
  const terpakai = lokasiList.value.filter((l) => ['pending', 'active'].includes(l.status)).length
  return `${Math.max(0, kuota - terpakai)} dari ${kuota} siswa`
})

const guruOptions = computed(() =>
  guruList.value.map((g) => ({
    value: g.id,
    label: g.nip ? `${g.user?.name ?? '—'} (${g.nip})` : (g.user?.name ?? '—'),
  }))
)

const guruHint = computed(() =>
  decision.value === 'approve' ? 'Opsional. Bisa diatur nanti lewat halaman Guru Pembimbing.' : ''
)

const guruTerpilih = computed(() => {
  const lokasi = lokasiList.value.find((l) => l.siswa?.id === data.value.siswa?.id && l.status !== 'cancelled')
  return lokasi?.guru?.nama || ''
})

watch(decision, () => {
  errors.guru = ''
  errors.alasan = ''
})
watch(alasan, () => (errors.alasan = ''))

async function load() {
  try {
    const res = await api.get(`/api/pengajuan-pkl/${props.id}`)
    data.value = res.data.data
  } catch (err) {
    loadError.value =
      err.response?.status === 404 ? 'Pengajuan tidak ditemukan.' : getErrorMessage(err, 'Gagal memuat data.')
    loading.value = false
    return
  }

  const d = data.value
  const [siswaRes, perusahaanRes, gelombangRes, lokasiRes, guruRes] = await Promise.allSettled([
    d.siswa?.id ? api.get(`/api/siswa/${d.siswa.id}`) : Promise.reject(),
    d.perusahaan?.id ? api.get(`/api/perusahaan/${d.perusahaan.id}`) : Promise.reject(),
    d.gelombang?.id ? api.get(`/api/gelombang/${d.gelombang.id}`) : Promise.reject(),
    d.perusahaan?.id && d.gelombang?.id
      ? fetchAllPages('/api/lokasi-pkl', { perusahaan_id: d.perusahaan.id, gelombang_id: d.gelombang.id })
      : Promise.reject(),
    d.status === 'pending' ? fetchAllPages('/api/guru') : Promise.resolve([]),
  ])

  if (siswaRes.status === 'fulfilled') siswa.value = siswaRes.value.data.data
  if (perusahaanRes.status === 'fulfilled') perusahaan.value = perusahaanRes.value.data.data
  if (gelombangRes.status === 'fulfilled') gelombang.value = gelombangRes.value.data.data
  if (lokasiRes.status === 'fulfilled') lokasiList.value = lokasiRes.value
  if (guruRes.status === 'fulfilled') guruList.value = guruRes.value

  loading.value = false
}

async function submit() {
  if (saving.value) return

  errors.guru = ''
  errors.alasan = ''

  if (decision.value === 'reject' && !alasan.value.trim()) {
    errors.alasan = 'Alasan penolakan wajib diisi.'
    return
  }

  saving.value = true
  try {
    const url = `/api/pengajuan-pkl/${props.id}/${decision.value}`
    const body =
      decision.value === 'approve'
        ? guruId.value
          ? { guru_pembimbing_id: Number(guruId.value) }
          : {}
        : { alasan_penolakan: alasan.value.trim() }

    const res = await api.put(url, body)
    toast.show(res.data.message || 'Keputusan berhasil disimpan.')
    router.push(backTo)
  } catch (err) {
    const statusCode = err.response?.status

    if (statusCode === 422) {
      const e = err.response.data?.errors ?? {}
      errors.guru = e.guru_pembimbing_id?.[0] || ''
      errors.alasan = e.alasan_penolakan?.[0] || ''
      if (!errors.guru && !errors.alasan) toast.show(getErrorMessage(err), 'error')
    } else if (statusCode && statusCode < 500 && ![401, 403, 419, 429].includes(statusCode)) {
      toast.show(getErrorMessage(err), 'error')
    }
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>