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
            <div>
              <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Pilih Siswa</label>

              <div
                v-if="siswa"
                class="flex h-10 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3"
              >
                <p class="min-w-0 truncate text-xs text-slate-900">{{ siswa.nama }} · {{ siswa.nis }}</p>
                <button type="button" class="shrink-0 text-xs font-semibold text-blue-600 hover:underline" @click="siswa = null">
                  Ganti
                </button>
              </div>

              <div v-else class="relative">
                <label
                  :class="[
                    'flex h-10 items-center gap-2 rounded-xl border bg-white px-3 focus-within:ring-2 focus-within:ring-blue-100',
                    local.siswa ? 'border-red-300' : 'border-slate-200 focus-within:border-blue-600',
                  ]"
                >
                  <input
                    v-model="q"
                    type="text"
                    placeholder="Pilih siswa"
                    class="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400"
                  />
                  <svg class="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                </label>

                <ul
                  v-if="q.trim().length >= 2"
                  class="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                >
                  <li v-if="searching" class="px-3 py-2 text-xs text-slate-400">Mencari…</li>
                  <li v-else-if="!results.length" class="px-3 py-2 text-xs text-slate-400">Siswa tidak ditemukan.</li>
                  <li v-for="s in results" :key="s.id">
                    <button type="button" class="block w-full px-3 py-2 text-left hover:bg-slate-50" @click="pick(s)">
                      <span class="block text-xs font-semibold text-slate-900">{{ s.user?.name ?? '—' }}</span>
                      <span class="block text-[11px] text-slate-500">NIS {{ s.nis }}<template v-if="s.kelas"> · {{ s.kelas }}</template></span>
                    </button>
                  </li>
                </ul>
              </div>

              <p v-if="local.siswa || fieldErrors.siswa_id" class="mt-1 text-xs text-red-600">
                {{ local.siswa || fieldErrors.siswa_id }}
              </p>
              <p v-else class="mt-1 text-[11px] text-slate-500">Hanya siswa yang belum ditempatkan.</p>
            </div>

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
                disabled
                title="Belum ada field di endpoint penempatan. Ubah lewat Edit Lokasi pada data perusahaan."
                placeholder="Masukkan pembimbing industri"
                class="h-10 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-600 outline-none placeholder:text-slate-400"
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
              disabled
              title="Belum ada field di endpoint penempatan. Koordinat diambil dari data perusahaan."
              placeholder="Masukkan koordinat"
              class="h-10 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-600 outline-none placeholder:text-slate-400"
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

      <FormCard title="Ringkasan Siswa">
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <AppIcon name="user" class="h-5 w-5" />
            </span>
            <div class="min-w-0">
              <p class="truncate text-xs font-semibold text-slate-900">{{ siswa ? siswa.nama : 'Belum ada siswa dipilih' }}</p>
              <p class="truncate text-[11px] text-slate-500">
                {{ siswa ? `NIS ${siswa.nis}${siswa.kelas ? ' · ' + siswa.kelas : ''}` : 'Pilih siswa untuk melihat ringkasan' }}
              </p>
            </div>
          </div>
          <InfoItem icon="building" label="Jurusan" :value="jurusanNama" />
          <InfoItem icon="file-text" label="Pengajuan" :value="pengajuanText" hint="Penempatan oleh admin" />
        </div>
      </FormCard>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { getErrorMessage } from '../../services/api'
import { fetchAllPages } from '../../utils/siswa'
import { terisiOf } from '../../utils/lokasi'
import { PENGAJUAN_STATUS } from '../../utils/pengajuan'
import { useToastStore } from '../../stores/toast'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import InfoItem from '../../components/InfoItem.vue'
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
  perusahaan_id: preselect,
  guru_id: '',
  gelombang_id: '',
  tanggal_mulai: '',
  tanggal_selesai: '',
})
const siswa = ref(null)
const needGelombang = ref(false)
let origSiswaId = null
const options = reactive({ perusahaan: [], guru: [], gelombang: [] })

const loadingData = ref(true)
const loadError = ref('')
const saving = ref(false)
const perusahaanHint = ref('Sisa kuota tampil setelah perusahaan dipilih.')

const perusahaan = ref(null)
const jurusanNama = ref('')
const pengajuanText = ref('')

const local = reactive({})
const fieldErrors = reactive({})

const q = ref('')
const results = ref([])
const searching = ref(false)
let timer = null
let seq = 0
let pseq = 0

const point = computed(() => {
  if (perusahaan.value?.latitude == null || perusahaan.value?.longitude == null) return null
  const lat = Number(perusahaan.value.latitude)
  const lng = Number(perusahaan.value.longitude)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
})
const koordinatText = computed(() => (point.value ? `${point.value.lat}, ${point.value.lng}` : ''))

watch(q, (val) => {
  clearTimeout(timer)
  const term = val.trim()
  if (term.length < 2) {
    results.value = []
    return
  }
  timer = setTimeout(async () => {
    const mine = ++seq
    searching.value = true
    try {
      const { data } = await api.get('/api/siswa', { params: { search: term } })
      if (mine === seq) results.value = data.data ?? []
    } catch {
      if (mine === seq) results.value = []
    } finally {
      if (mine === seq) searching.value = false
    }
  }, 350)
})

function pick(s) {
  siswa.value = { id: s.id, nama: s.user?.name ?? '—', nis: s.nis, kelas: s.kelas }
  q.value = ''
  results.value = []
  delete local.siswa
  delete fieldErrors.siswa_id
}

watch(
  () => siswa.value?.id,
  async (sid) => {
    jurusanNama.value = ''
    pengajuanText.value = ''
    if (!sid) return
    try {
      const { data } = await api.get(`/api/siswa/${sid}`)
      const s = data.data
      jurusanNama.value = s.jurusan?.nama ?? ''
      if (siswa.value?.id === sid && s.kelas) siswa.value.kelas = s.kelas
      if (siswa.value?.id === sid && (!isEdit || sid !== origSiswaId)) {
        form.gelombang_id = s.gelombang?.id ? String(s.gelombang.id) : ''
        needGelombang.value = !s.gelombang?.id
      }
    } catch {
    }
    try {
      const list = await fetchAllPages('/api/pengajuan-pkl', { siswa_id: sid })
      const nis = siswa.value?.nis
      const latest = list.filter((p) => p.siswa?.nis === nis).sort((a, b) => b.id - a.id)[0]
      if (siswa.value?.id === sid) {
        pengajuanText.value = latest ? PENGAJUAN_STATUS[latest.status]?.label ?? latest.status : 'Belum ada pengajuan'
      }
    } catch {
    }
  }
)

async function loadPerusahaan() {
  const id = form.perusahaan_id
  const mine = ++pseq
  perusahaan.value = null
  if (!id) return
  try {
    const [p, l] = await Promise.all([
      api.get(`/api/perusahaan/${id}`),
      fetchAllPages('/api/lokasi-pkl', { perusahaan_id: id }),
    ])
    if (mine !== pseq) return
    perusahaan.value = p.data.data
    const kuota = perusahaan.value.kuota
    perusahaanHint.value =
      kuota == null ? 'Kuota perusahaan tidak dibatasi.' : `Sisa kuota ${Math.max(kuota - terisiOf(l), 0)} siswa.`
  } catch {
  }
}

watch(() => form.perusahaan_id, loadPerusahaan)

async function loadOptions() {
  const [p, g, gel] = await Promise.all([
    fetchAllPages('/api/perusahaan', isEdit ? {} : { kuota_tersedia: 1 }),
    fetchAllPages('/api/guru'),
    api.get('/api/gelombang'),
  ])
  options.perusahaan = p.map((x) => ({ value: String(x.id), label: x.nama }))
  options.guru = [
    { value: 'none', label: 'Belum ditentukan' },
    ...g.map((x) => ({ value: String(x.id), label: `${x.user?.name ?? '—'} (${x.nip})` })),
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
  siswa.value = { id: l.siswa?.id, nama: l.siswa?.nama ?? '—', nis: l.siswa?.nis ?? '—', kelas: '' }
  form.perusahaan_id = l.perusahaan ? String(l.perusahaan.id) : ''
  form.guru_id = l.guru ? String(l.guru.id) : 'none'
  form.gelombang_id = l.gelombang ? String(l.gelombang.id) : ''
  origSiswaId = l.siswa?.id ?? null
  form.tanggal_mulai = l.tanggal_mulai ?? ''
  form.tanggal_selesai = l.tanggal_selesai ?? ''
  backTo.value = fromDetail && l.perusahaan ? `${LIST_PATH}/${l.perusahaan.id}` : LIST_PATH
}

onMounted(async () => {
  try {
    await Promise.all([loadOptions(), isEdit ? loadPenempatan() : Promise.resolve()])
    if (form.perusahaan_id && !perusahaan.value) loadPerusahaan()
  } catch (err) {
    loadError.value =
      err.response?.status === 404 ? 'Penempatan tidak ditemukan.' : getErrorMessage(err, 'Gagal memuat data.')
  } finally {
    loadingData.value = false
  }
})

onBeforeUnmount(() => clearTimeout(timer))

function validate() {
  Object.keys(local).forEach((k) => delete local[k])
  if (!siswa.value) local.siswa = 'Wajib diisi.'
  if (!form.perusahaan_id) local.perusahaan = 'Wajib diisi.'
  if (!form.gelombang_id) {
    local.gelombang = 'Wajib diisi.'
    if (siswa.value) needGelombang.value = true
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
    perusahaan_id: Number(form.perusahaan_id),
    guru_id: !form.guru_id || form.guru_id === 'none' ? null : Number(form.guru_id),
    gelombang_id: Number(form.gelombang_id),
    tanggal_mulai: form.tanggal_mulai || null,
    tanggal_selesai: form.tanggal_selesai || null,
  }

  try {
    const res = isEdit
      ? await api.put(`/api/lokasi-pkl/${props.id}`, { ...payload, siswa_id: siswa.value.id })
      : await api.post('/api/lokasi-pkl', { ...payload, siswa_id: siswa.value.id })
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
