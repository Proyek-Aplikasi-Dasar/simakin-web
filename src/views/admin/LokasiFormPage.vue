<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Lokasi & Penempatan', to: '/admin/lokasi-penempatan' }, { label: pageTitle }]"
      :title="`${pageTitle} PKL`"
      subtitle="Alokasikan siswa ke tempat PKL dan tentukan guru pembimbing."
    >
      <router-link
        :to="backTo"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </router-link>
    </PageHeader>

    <PageSkeleton v-if="loadingData" />
    <div v-else-if="loadError" class="flex flex-col items-center gap-3 py-16 text-center">
      <p class="text-sm text-red-600">{{ loadError }}</p>
      <router-link to="/admin/lokasi-penempatan" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50">
        Kembali ke daftar
      </router-link>
    </div>

    <form
      v-else
      class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]"
      novalidate
      @submit.prevent="submit"
    >
      <FormCard title="Form Penempatan" description="Penempatan langsung tanpa pengajuan siswa.">
        <div class="flex flex-col gap-5">
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              id="siswa"
              :model-value="form.siswa_id"
              label="Pilih Siswa"
              placeholder="Pilih siswa"
              searchable
              :options="siswaOptions"
              :hint="isEdit ? 'Pilih untuk berpindah ke penempatan siswa lain di perusahaan ini.' : 'Hanya siswa yang belum ditempatkan.'"
              :error="local.siswa || fieldErrors.siswa_id || ''"
              @update:model-value="onPilihSiswa"
            />

            <FormField
              id="perusahaan"
              v-model="form.perusahaan_id"
              label="Perusahaan / Lokasi PKL"
              placeholder="Pilih perusahaan / lokasi PKL"
              searchable
              :options="options.perusahaan"
              :hint="perusahaanHint"
              :error="local.perusahaan || fieldErrors.perusahaan_id || ''"
            />
          </div>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              id="guru"
              v-model="form.guru_id"
              label="Guru Pembimbing"
              placeholder="Pilih guru pembimbing"
              searchable
              :options="options.guru"
              :error="fieldErrors.guru_id || ''"
            />

            <div>
              <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Pembimbing Industri</label>
              <input
                :value="perusahaan?.pembimbing_industri ?? ''"
                readonly
                title="Terisi otomatis dari data perusahaan. Ubah lewat Edit Perusahaan."
                placeholder="Masukkan pembimbing industri"
                class="h-10 w-full cursor-default rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <FormField
            v-if="needGelombang"
            id="gelombang"
            v-model="form.gelombang_id"
            label="Gelombang PKL"
            placeholder="Pilih gelombang"
            searchable
            :options="options.gelombang"
            :error="local.gelombang || fieldErrors.gelombang_id || ''"
          />

          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              id="tanggal_mulai"
              v-model="form.tanggal_mulai"
              type="date"
              label="Tanggal Mulai"
              :error="fieldErrors.tanggal_mulai || ''"
            />
            <FormField
              id="tanggal_selesai"
              v-model="form.tanggal_selesai"
              type="date"
              label="Tanggal Selesai"
              :min="form.tanggal_mulai || undefined"
              :error="local.tanggal_selesai || fieldErrors.tanggal_selesai || ''"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Titik Lokasi PKL</label>
            <div v-if="point" class="h-[200px]">
              <MapView :key="form.perusahaan_id" :latitude="point.lat" :longitude="point.lng" />
            </div>
            <div v-else class="flex h-[200px] items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500">
              {{ form.perusahaan_id ? 'Koordinat belum diisi untuk perusahaan ini' : 'Pilih perusahaan untuk melihat titik lokasi' }}
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Koordinat</label>
            <input
              :value="koordinatText"
              readonly
              title="Terisi otomatis dari data perusahaan."
              placeholder="Masukkan koordinat"
              class="h-10 w-full cursor-default rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400"
            />
            <p class="mt-1 text-[11px] text-slate-500">Koordinat lokasi perusahaan di peta.</p>
          </div>
        </div>

        <template #footer>
          <router-link :to="backTo" class="px-3 text-sm font-semibold text-blue-600">Batal</router-link>
          <button
            type="submit"
            :disabled="saving"
            class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <AppIcon name="save" class="h-4 w-4" />
            {{ saving ? 'Menyimpan…' : 'Simpan Penempatan' }}
          </button>
        </template>
      </FormCard>

      <FormCard title="Ringkasan Siswa" :description="ringkasanDesc">
        <p v-if="!daftarSiswa.length" class="text-xs text-slate-500">
          {{ form.perusahaan_id ? 'Belum ada siswa ditempatkan di perusahaan ini.' : 'Pilih perusahaan untuk melihat siswa yang terdaftar.' }}
        </p>
        <ul v-else class="flex flex-col gap-2">
          <li
            v-for="s in daftarSiswa"
            :key="s.key"
            :class="['flex items-center gap-3 rounded-xl p-2', s.current ? 'bg-blue-50' : '']"
          >
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <AppIcon name="user" class="h-5 w-5" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-semibold text-slate-900">{{ s.nama }}</p>
              <p class="truncate text-[11px] text-slate-500">NIS {{ s.nis }}<template v-if="s.kelas"> · {{ s.kelas }}</template></p>
            </div>
            <span
              v-if="s.status"
              :class="['inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-[2px] text-[11px] font-semibold leading-4', LOKASI_BADGE[s.status].box]"
            >
              <span :class="['h-1.5 w-1.5 rounded-full', LOKASI_BADGE[s.status].dot]" />
              {{ LOKASI_BADGE[s.status].label }}
            </span>
            <span
              v-else
              class="inline-flex shrink-0 items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-[2px] text-[11px] font-semibold leading-4 text-blue-700"
            >
              Akan ditambahkan
            </span>
          </li>
        </ul>
      </FormCard>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { getErrorMessage } from '../../services/api'
import { fetchAllPages } from '../../utils/siswa'
import { terisiOf, MEMAKAI_KUOTA, LOKASI_BADGE } from '../../utils/lokasi'
import { useToastStore } from '../../stores/toast'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import MapView from '../../components/MapView.vue'
import AppIcon from '../../components/AppIcon.vue'
import PageSkeleton from '../../components/PageSkeleton.vue'

const props = defineProps({ id: { type: String, default: null } })

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const isEdit = !!props.id
const pageTitle = isEdit ? 'Edit Penempatan' : 'Tambah Penempatan'
const preselect = route.query.perusahaan_id ? String(route.query.perusahaan_id) : ''
// Kembali ke halaman asal: dari detail lokasi (?from=detail) -> detail, selain itu -> daftar
const LIST_PATH = '/admin/lokasi-penempatan'
const fromDetail = route.query.from === 'detail'
const backTo = ref(fromDetail && preselect ? `${LIST_PATH}/${preselect}` : LIST_PATH)

const form = reactive({
  siswa_id: '',
  perusahaan_id: preselect,
  guru_id: '',
  gelombang_id: '',
  tanggal_mulai: '',
  tanggal_selesai: '',
})
const needGelombang = ref(false)
const origSiswaId = ref('')
const siswaAll = ref([])
const siswaPlaced = ref(new Set())
const options = reactive({ perusahaan: [], guru: [], gelombang: [] })

const loadingData = ref(true)
const loadError = ref('')
const saving = ref(false)
const perusahaanHint = ref('Sisa kuota tampil setelah perusahaan dipilih.')

const perusahaan = ref(null)
// Semua penempatan di perusahaan yang sedang dipilih di form, sumber Ringkasan Siswa
const penempatanPerusahaan = ref([])

const local = reactive({})
const fieldErrors = reactive({})

let pseq = 0

const point = computed(() => {
  if (perusahaan.value?.latitude == null || perusahaan.value?.longitude == null) return null
  const lat = Number(perusahaan.value.latitude)
  const lng = Number(perusahaan.value.longitude)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
})
const koordinatText = computed(() => (point.value ? `${point.value.lat}, ${point.value.lng}` : ''))

const siswaMap = computed(() => new Map(siswaAll.value.map((s) => [String(s.id), s])))

// Penempatan lain di perusahaan yang sama (mode edit), sumber dropdown untuk berpindah antar siswa
const siblings = ref([])

// Mode tambah: siswa yang belum ditempatkan.
// Mode edit: hanya siswa yang sudah punya penempatan di perusahaan ini, dipakai untuk berpindah ke penempatan siswa lain.
const siswaOptions = computed(() => {
  if (!isEdit) {
    return siswaAll.value
      .filter((s) => !siswaPlaced.value.has(s.id))
      .map((s) => ({ value: String(s.id), label: `${s.user?.name ?? '—'} · ${s.nis}` }))
  }
  const opts = siblings.value
    .filter((l) => l.siswa?.id && (MEMAKAI_KUOTA.includes(l.status) || String(l.id) === String(props.id)))
    .map((l) => ({ value: String(l.siswa.id), label: `${l.siswa.nama ?? '—'} · ${l.siswa.nis ?? '—'}` }))
  const cur = siswaMap.value.get(origSiswaId.value)
  if (cur && !opts.some((o) => o.value === origSiswaId.value)) {
    opts.unshift({ value: origSiswaId.value, label: `${cur.user?.name ?? '—'} · ${cur.nis}` })
  }
  return opts
})

// Mode edit: memilih siswa lain = pindah ke form edit penempatan siswa itu (query seperti ?from=detail dipertahankan)
function onPilihSiswa(value) {
  if (!isEdit) {
    form.siswa_id = value
    return
  }
  if (!value || String(value) === origSiswaId.value) return
  const target = siblings.value.find((l) => String(l.siswa?.id) === String(value) && MEMAKAI_KUOTA.includes(l.status))
  if (target) router.replace({ path: `${LIST_PATH}/penempatan/${target.id}/edit`, query: route.query })
}

const siswa = computed(() => {
  const s = siswaMap.value.get(String(form.siswa_id))
  return s ? { nama: s.user?.name ?? '—', nis: s.nis, kelas: s.kelas } : null
})

// Ringkasan Siswa: semua siswa yang terdaftar (menunggu/aktif) di perusahaan yang dipilih, siswa yang sedang dipilih disorot.
// Kelas diambil dari data siswa; kosong bila tidak ada.
const daftarSiswa = computed(() => {
  const rows = penempatanPerusahaan.value
    .filter((l) => l.siswa?.id && MEMAKAI_KUOTA.includes(l.status))
    .map((l) => ({
      key: `l${l.id}`,
      nama: l.siswa.nama ?? '—',
      nis: l.siswa.nis ?? '—',
      kelas: siswaMap.value.get(String(l.siswa.id))?.kelas ?? '',
      status: l.status,
      current: String(l.siswa.id) === String(form.siswa_id),
    }))
  // Mode tambah: siswa yang dipilih belum punya penempatan di sini, tampilkan di atas sebagai calon
  if (!isEdit && siswa.value && !rows.some((r) => r.current)) {
    rows.unshift({ key: 'baru', nama: siswa.value.nama, nis: siswa.value.nis, kelas: siswa.value.kelas ?? '', status: null, current: true })
  }
  return rows
})

const ringkasanDesc = computed(() =>
  perusahaan.value
    ? `${daftarSiswa.value.filter((r) => r.status).length} siswa terdaftar di ${perusahaan.value.nama}.`
    : ''
)

watch(
  () => form.siswa_id,
  (sid) => {
    delete local.siswa
    delete fieldErrors.siswa_id
    const s = siswaMap.value.get(String(sid))
    if (!s) return
    if (!isEdit || String(sid) !== origSiswaId.value) {
      form.gelombang_id = s.gelombang?.id ? String(s.gelombang.id) : ''
      needGelombang.value = !s.gelombang?.id
    }
  }
)

async function loadPerusahaan() {
  const id = form.perusahaan_id
  const mine = ++pseq
  perusahaan.value = null
  penempatanPerusahaan.value = []
  if (!id) return
  try {
    const [p, l] = await Promise.allSettled([
      api.get(`/api/perusahaan/${id}`),
      fetchAllPages('/api/lokasi-pkl', { perusahaan_id: id }),
    ])
    if (mine !== pseq) return
    if (p.status !== 'fulfilled') return
    perusahaan.value = p.value.data.data
    if (l.status !== 'fulfilled') return
    penempatanPerusahaan.value = l.value
    const kuota = perusahaan.value.kuota
    perusahaanHint.value =
      kuota == null ? 'Kuota perusahaan tidak dibatasi.' : `Sisa kuota ${Math.max(kuota - terisiOf(l.value), 0)} siswa.`
  } catch {
  }
}

watch(() => form.perusahaan_id, loadPerusahaan)

async function loadOptions() {
  const [p, g, gel, sis, lokasi] = await Promise.all([
    fetchAllPages('/api/perusahaan', isEdit ? {} : { kuota_tersedia: 1 }),
    fetchAllPages('/api/guru'),
    api.get('/api/gelombang'),
    fetchAllPages('/api/siswa'),
    fetchAllPages('/api/lokasi-pkl'),
  ])
  siswaAll.value = sis
  // Siswa dianggap sudah ditempatkan bila punya penempatan selain dibatalkan (menunggu / aktif / selesai).
  // BE hanya menolak yang berstatus aktif, jadi penempatan "menunggu" harus dicegah di sini.
  siswaPlaced.value = new Set(lokasi.filter((l) => l.siswa?.id && l.status !== 'cancelled').map((l) => l.siswa.id))
  options.perusahaan = p.map((x) => ({ value: String(x.id), label: x.nama }))
  options.guru = [
    { value: 'none', label: 'Belum ditentukan' },
    ...g.map((x) => ({ value: String(x.id), label: x.user?.name ?? '—' })),
  ]
  options.gelombang = (gel.data.data ?? []).map((x) => ({ value: String(x.id), label: `${x.nama} — ${x.tahun_ajaran}` }))

  if (!isEdit && form.perusahaan_id && !options.perusahaan.some((o) => o.value === form.perusahaan_id)) {
    form.perusahaan_id = ''
    perusahaanHint.value = 'Perusahaan yang dipilih sebelumnya sudah penuh kuotanya.'
  }
}

async function loadPenempatan() {
  const { data } = await api.get(`/api/lokasi-pkl/${props.id}`)
  const l = data.data
  origSiswaId.value = l.siswa?.id ? String(l.siswa.id) : ''
  form.siswa_id = origSiswaId.value
  form.perusahaan_id = l.perusahaan ? String(l.perusahaan.id) : ''
  form.guru_id = l.guru ? String(l.guru.id) : 'none'
  form.gelombang_id = l.gelombang ? String(l.gelombang.id) : ''
  form.tanggal_mulai = l.tanggal_mulai ?? ''
  form.tanggal_selesai = l.tanggal_selesai ?? ''
  backTo.value = fromDetail && l.perusahaan ? `${LIST_PATH}/${l.perusahaan.id}` : LIST_PATH

  // Daftar siswa di perusahaan ini hanya pelengkap dropdown; gagal memuat tidak boleh memblokir form
  try {
    siblings.value = l.perusahaan ? await fetchAllPages('/api/lokasi-pkl', { perusahaan_id: l.perusahaan.id }) : []
  } catch {
    siblings.value = []
  }
}

let optionsLoaded = false

async function init() {
  loadingData.value = true
  loadError.value = ''
  try {
    await Promise.all([
      optionsLoaded ? Promise.resolve() : loadOptions().then(() => (optionsLoaded = true)),
      isEdit ? loadPenempatan() : Promise.resolve(),
    ])
    if (form.perusahaan_id && !perusahaan.value) loadPerusahaan()
  } catch (err) {
    loadError.value =
      err.response?.status === 404 ? 'Penempatan tidak ditemukan.' : getErrorMessage(err, 'Gagal memuat data.')
  } finally {
    loadingData.value = false
  }
}

onMounted(init)

// Komponen yang sama dipakai ulang saat berpindah siswa lewat dropdown (hanya :id yang berubah): kosongkan form lalu muat ulang
watch(
  () => props.id,
  (id, old) => {
    if (!isEdit || !id || id === old) return
    Object.assign(form, { siswa_id: '', perusahaan_id: '', guru_id: '', gelombang_id: '', tanggal_mulai: '', tanggal_selesai: '' })
    Object.keys(local).forEach((k) => delete local[k])
    Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
    needGelombang.value = false
    perusahaan.value = null
    init()
  }
)

function validate() {
  Object.keys(local).forEach((k) => delete local[k])
  if (!form.siswa_id) local.siswa = 'Wajib diisi.'
  if (!form.perusahaan_id) local.perusahaan = 'Wajib diisi.'
  if (!form.gelombang_id) {
    local.gelombang = 'Wajib diisi.'
    if (form.siswa_id) needGelombang.value = true
  }
  if (form.tanggal_mulai && form.tanggal_selesai && form.tanggal_selesai < form.tanggal_mulai) {
    local.tanggal_selesai = 'Tanggal selesai tidak boleh sebelum tanggal mulai.'
  }
  return Object.keys(local).length === 0
}

async function submit() {
  if (saving.value || !validate()) return
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  saving.value = true

  const payload = {
    siswa_id: Number(form.siswa_id),
    perusahaan_id: Number(form.perusahaan_id),
    guru_id: !form.guru_id || form.guru_id === 'none' ? null : Number(form.guru_id),
    gelombang_id: Number(form.gelombang_id),
    tanggal_mulai: form.tanggal_mulai || null,
    tanggal_selesai: form.tanggal_selesai || null,
  }

  try {
    if (!isEdit) {
      const cek = await api.get('/api/lokasi-pkl', { params: { siswa_id: payload.siswa_id } })
      if ((cek.data.data ?? []).some((l) => l.status !== 'cancelled')) {
        local.siswa = 'Siswa sudah memiliki penempatan PKL.'
        siswaPlaced.value = new Set(siswaPlaced.value).add(payload.siswa_id)
        return
      }
    }
    const res = isEdit
      ? await api.put(`/api/lokasi-pkl/${props.id}`, payload)
      : await api.post('/api/lokasi-pkl', payload)
    toast.show(res.data.message || 'Penempatan disimpan.')
    router.push(backTo.value)
  } catch (err) {
    const status = err.response?.status
    const body = err.response?.data
    if (status === 422) {
      if (body?.code === 'SISWA_ALREADY_PLACED') local.siswa = body.message
      else if (body?.errors) Object.entries(body.errors).forEach(([k, v]) => (fieldErrors[k] = v[0]))
      else toast.show(getErrorMessage(err), 'error')
    } else if (status && status < 500 && ![401, 403, 419, 429].includes(status)) {
      toast.show(getErrorMessage(err), 'error')
    }
  } finally {
    saving.value = false
  }
}
</script>
