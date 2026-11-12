<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Data Master', to: backTo }, { label: pageTitle }]"
      :title="pageTitle"
      subtitle="Perusahaan yang disimpan di sini muncul di daftar pilihan tempat PKL siswa."
    >
      <router-link
        :to="backTo"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </router-link>
    </PageHeader>

    <p v-if="loadError" class="mb-6 rounded-lg bg-red-50 p-3 text-xs text-red-600">{{ loadError }}</p>

    <form class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" novalidate @submit.prevent="submit">
      <FormCard title="Form Data Perusahaan" description="Pastikan data perusahaan mitra terisi dengan benar.">
        <p v-if="loading" class="text-sm text-slate-500">Memuat data...</p>

        <div v-else class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField id="nama" v-model="form.nama" label="Nama Perusahaan" required placeholder="Masukkan nama perusahaan" :error="errorOf('nama')" @blur="touch('nama')" />
          <FormField id="pimpinan" v-model="form.pimpinan" label="Pimpinan" placeholder="Masukkan nama pimpinan" :error="errorOf('pimpinan')" />
          <FormField id="telp" v-model="form.telp" label="Nomor Telepon" placeholder="Masukkan nomor telepon" :error="errorOf('telp')" @blur="touch('telp')" />
          <FormField id="email" v-model="form.email" type="email" label="Email" placeholder="Masukkan email" :error="errorOf('email')" @blur="touch('email')" />
          <FormField id="kuota" v-model="form.kuota" type="number" label="Kuota Siswa" placeholder="0" suffix="siswa" :error="errorOf('kuota')" @blur="touch('kuota')" />
          <div class="md:col-span-2">
            <FormField
              id="alamat"
              v-model="form.alamat"
              textarea
              :rows="4"
              label="Alamat Lengkap"
              required
              placeholder="Masukkan alamat lengkap"
              :error="errorOf('alamat')"
              @blur="touch('alamat')"
            />
          </div>
          <div class="md:col-span-2">
            <FormField
              id="deskripsi"
              v-model="form.deskripsi"
              textarea
              :rows="4"
              label="Tentang Perusahaan"
              placeholder="Ceritakan singkat tentang perusahaan"
              :error="fieldErrors.deskripsi"
            />
          </div>
          <div class="md:col-span-2">
            <MultiSelectChips
              id="jurusan"
              v-model="form.jurusan_ids"
              label="Program Studi yang Diterima"
              placeholder="Pilih program studi"
              :options="jurusanOptions"
              :error="jurusanError"
              hint="Pilih satu atau lebih program studi yang boleh memilih perusahaan ini."
            />
          </div>
        </div>

        <template #footer>
          <router-link :to="backTo" class="px-3 text-sm font-semibold text-blue-600">Batal</router-link>
          <button
            type="submit"
            :disabled="saving || loading || !!loadError"
            class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <AppIcon name="save" class="h-4 w-4" />
            {{ saving ? 'Menyimpan...' : 'Simpan Data' }}
          </button>
        </template>
      </FormCard>

      <div class="flex flex-col gap-6 self-start">
      <FormCard title="Titik Lokasi" description="Lokasi perusahaan di peta.">
        <div class="h-44">
          <MapView :latitude="point.lat" :longitude="point.lng" selectable @pick="onPick" />
        </div>
        <p class="mt-2 text-[11px] text-slate-500">Klik peta atau geser marker untuk memilih titik.</p>
        <div class="mt-4 flex flex-col gap-4">
          <FormField id="latitude" v-model="form.latitude" label="Latitude" placeholder="Contoh: -7.4705" :error="errorOf('latitude')" @blur="touch('latitude')" />
          <FormField
            id="longitude"
            v-model="form.longitude"
            label="Longitude"
            placeholder="Contoh: 110.2183"
            :error="errorOf('longitude')"
            hint="Opsional. Dipakai untuk lokasi presensi siswa."
            @blur="touch('longitude')"
          />
        </div>
      </FormCard>
      </div>
    </form>
  </div>
</template>

<script setup>
import { useFormValidation } from '../../composables/useFormValidation'
import { required, email, phone, integer, min, latitude, longitude } from '../../utils/validators'
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import MultiSelectChips from '../../components/MultiSelectChips.vue'
import AppIcon from '../../components/AppIcon.vue'
import MapView from '../../components/MapView.vue'
import api, { getErrorMessage } from '../../services/api'
import { useMasterResource, fetchAll } from '../../composables/useMasterResource'

const props = defineProps({
  id: { type: String, default: null }, 
})

const router = useRouter()
const isEdit = !!props.id
const pageTitle = isEdit ? 'Edit Perusahaan' : 'Tambah Perusahaan'
const route = useRoute()
const backTo =
  route.query.from === 'lokasi'
    ? { name: 'lokasi-penempatan' }
    : { name: 'data-master', query: { tab: 'perusahaan' } }

const form = reactive({
  nama: '',
  pimpinan: '',
  telp: '',
  email: '',
  kuota: '',
  alamat: '',
  deskripsi: '',
  latitude: '',
  longitude: '',
  jurusan_ids: [],
})

const jurusanList = ref([])
const jurusanOptions = computed(() => jurusanList.value.map((j) => ({ value: j.id, label: j.nama })))
const loading = ref(true)
const loadError = ref('')

const { saving, fieldErrors, save } = useMasterResource('/api/perusahaan', { name: 'Perusahaan', reload: false })

const { errorOf, validate, touch, focusFirstError } = useFormValidation(
  form,
  {
    nama: [required('Nama perusahaan wajib diisi.')],
    alamat: [required('Alamat wajib diisi.')],
    telp: [phone()],
    email: [email()],
    kuota: [integer(), min(0)],
    latitude: [latitude()],
    longitude: [longitude()],
  },
  { external: () => fieldErrors.value }
)

const jurusanError = computed(
  () =>
    fieldErrors.value.jurusan_ids ??
    Object.entries(fieldErrors.value).find(([key]) => key.startsWith('jurusan_ids.'))?.[1] ??
    ''
)

const point = computed(() => {
  const toNum = (v) => (v === null || v === undefined || String(v).trim() === '' ? NaN : Number(v))
  const lat = toNum(form.latitude)
  const lng = toNum(form.longitude)
  const ok = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  return ok ? { lat, lng } : { lat: null, lng: null }
})

function onPick({ lat, lng }) {
  form.latitude = lat.toFixed(6)
  form.longitude = lng.toFixed(6)
}

onMounted(async () => {
  try {
    const tasks = [fetchAll('/api/jurusan').then((list) => (jurusanList.value = list))]

    if (isEdit) {
      tasks.push(
        api.get(`/api/perusahaan/${props.id}`).then(({ data }) => {
          const p = data.data
          for (const key of ['nama', 'pimpinan', 'telp', 'email', 'kuota', 'alamat', 'deskripsi', 'latitude', 'longitude']) {
            form[key] = p[key] ?? ''
          }
          form.jurusan_ids = (p.jurusan ?? []).map((j) => j.id)
        })
      )
    }

    await Promise.all(tasks)
  } catch (err) {
    loadError.value =
      err.response?.status === 404 ? 'Data tidak ditemukan.' : getErrorMessage(err, 'Gagal memuat data.')
  } finally {
    loading.value = false
  }
})

async function submit() {
  if (!validate()) return
  const ok = await save({
    mode: isEdit ? 'edit' : 'create',
    row: { id: props.id },
    values: { ...form },
  })
  if (ok) router.push(backTo)
  else focusFirstError()
}
</script>