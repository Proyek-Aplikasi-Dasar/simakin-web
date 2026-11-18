<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Presensi Siswa', to: listPath }, { label: isEdit ? 'Edit Presensi' : 'Tambah Presensi' }]"
      :title="isEdit ? 'Edit Presensi' : 'Tambah Presensi'"
      :subtitle="isEdit ? 'Perbarui presensi siswa yang sudah tercatat.' : 'Catat presensi manual untuk siswa yang belum presensi.'"
    >
      <router-link
        :to="listPath"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </router-link>
    </PageHeader>

    <PageSkeleton v-if="loadingData" />
    <div v-else-if="loadError" class="py-16 text-center text-sm text-red-600">{{ loadError }}</div>

    <div v-else class="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
      <form novalidate @submit.prevent="submit">
        <FormCard title="Form Presensi" description="Satu presensi per hari, sama seperti form di aplikasi siswa.">
          <div class="flex flex-col gap-5">
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Siswa</label>
                <input v-if="isEdit" :value="siswaLabel" disabled :class="[inputCls, 'bg-slate-50']" />

                <div
                  v-else-if="selected"
                  class="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5"
                >
                  <div class="min-w-0">
                    <p class="truncate text-xs font-semibold leading-[18px] text-slate-900">{{ selected.nama }}</p>
                    <p class="truncate text-[11px] leading-[14px] text-slate-500">NIS {{ selected.nis }}<template v-if="selected.perusahaan"> · {{ selected.perusahaan }}</template></p>
                  </div>
                  <button type="button" class="shrink-0 text-xs font-semibold text-blue-600 hover:underline" @click="ganti">Ganti</button>
                </div>

                <div v-else class="relative">
                  <label class="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                    <AppIcon name="search" class="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      v-model="q"
                      type="text"
                      placeholder="Cari nama atau NIS siswa…"
                      class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                      @focus="open = true"
                      @blur="open = false"
                    />
                  </label>

                  <ul
                    v-if="open"
                    class="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                  >
                    <li v-if="!hasil.length" class="px-3 py-2 text-xs text-slate-400">Siswa tidak ditemukan.</li>
                    <li v-for="s in hasil" :key="s.id">
                      <button type="button" class="block w-full px-3 py-2 text-left hover:bg-slate-50" @mousedown.prevent="pilih(s)">
                        <span class="block text-xs font-semibold text-slate-900">{{ s.nama }}</span>
                        <span class="block text-[11px] text-slate-500">NIS {{ s.nis }}<template v-if="s.perusahaan"> · {{ s.perusahaan }}</template></span>
                      </button>
                    </li>
                    <li v-if="totalCocok > hasil.length" class="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400">
                      Menampilkan {{ hasil.length }} dari {{ totalCocok }} siswa. Ketik untuk mempersempit.
                    </li>
                  </ul>
                </div>

                <p v-if="errors.siswa_id" class="mt-1 text-xs text-red-600">{{ errors.siswa_id }}</p>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Tanggal</label>
                <DatePicker v-model="form.tanggal" size="lg" :disabled="isEdit" />
              </div>
            </div>

            <RadioCardGroup id="status-presensi" v-model="form.status" label="Status Kehadiran" :options="statusOptions" :error="errors.status" />

            <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Jam Masuk</label>
                <input v-model="form.jam_masuk" type="time" :class="inputCls" />
                <p v-if="errors.jam_masuk" class="mt-1 text-xs text-red-600">{{ errors.jam_masuk }}</p>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Jam Shift Mulai</label>
                <input v-model="form.jam_shift_mulai" type="time" :class="inputCls" />
                <p v-if="errors.jam_shift_mulai" class="mt-1 text-xs text-red-600">{{ errors.jam_shift_mulai }}</p>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Jam Shift Selesai</label>
                <input v-model="form.jam_shift_selesai" type="time" :class="inputCls" />
                <p v-if="errors.jam_shift_selesai" class="mt-1 text-xs text-red-600">{{ errors.jam_shift_selesai }}</p>
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">
                Keterangan<span v-if="perluKeterangan" class="text-red-600"> *</span>
              </label>
              <textarea
                v-model="form.keterangan"
                rows="5"
                placeholder="Masukkan keterangan"
                :class="[inputCls, 'h-auto py-3']"
              ></textarea>
              <p v-if="errors.keterangan" class="mt-1 text-xs text-red-600">{{ errors.keterangan }}</p>
            </div>

            <div v-if="!isEdit && ['izin', 'sakit'].includes(form.status)">
              <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Berkas Pendukung (opsional)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                class="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-blue-600 hover:file:bg-blue-100"
                @change="onBerkas"
              />
              <p class="mt-1 text-[11px] text-slate-500">PDF, JPG, atau PNG, maksimal 5 MB.</p>
              <p v-if="errors.berkas_pendukung" class="mt-1 text-xs text-red-600">{{ errors.berkas_pendukung }}</p>
            </div>
          </div>

          <template #footer>
            <router-link :to="listPath" class="px-3 text-sm font-semibold text-blue-600 hover:underline">Batal</router-link>
            <button
              type="submit"
              :disabled="saving"
              class="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <AppIcon name="save" class="h-5 w-5" />
              {{ saving ? 'Menyimpan…' : 'Simpan Presensi' }}
            </button>
          </template>
        </FormCard>
      </form>

      <aside class="flex flex-col gap-4">
        <InfoAlert
          icon="alert"
          :title="isEdit ? 'Koreksi presensi' : 'Presensi manual'"
          :text="isEdit ? 'Perubahan tercatat di riwayat dan terlihat oleh guru pembimbing.' : 'Dicatat atas nama siswa dan langsung terlihat di riwayat.'"
        />

        <FormCard v-if="isEdit && lama" title="Data Sebelumnya">
          <div class="flex flex-col gap-4">
            <InfoItem icon="circle-x" label="Status" :value="PRESENSI_STATUS[lama.status]?.label" />
            <InfoItem icon="arrow-right" label="Waktu Kirim" :value="lama.jam_masuk ? `${jamOnly(lama.jam_masuk)} WIB` : ''" />
            <InfoItem
              v-if="lama.jam_shift_mulai || lama.jam_shift_selesai"
              icon="hourglass"
              label="Jam Shift"
              :value="`${lama.jam_shift_mulai ? jamOnly(lama.jam_shift_mulai) : '—'} – ${lama.jam_shift_selesai ? jamOnly(lama.jam_shift_selesai) : '—'} WIB`"
            />
            <InfoItem icon="user" label="Diubah Oleh" :value="lama.korektor?.name ?? 'Siswa'" />
          </div>
        </FormCard>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { getErrorMessage } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import { useAuthStore } from '../../stores/auth'
import { fetchAllPages, groupBySiswa, jamOnly, toIso } from '../../utils/siswa'
import { PRESENSI_STATUS } from '../../utils/presensi'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import InfoItem from '../../components/InfoItem.vue'
import InfoAlert from '../../components/InfoAlert.vue'
import RadioCardGroup from '../../components/RadioCardGroup.vue'
import AppIcon from '../../components/AppIcon.vue'
import PageSkeleton from '../../components/PageSkeleton.vue'
import DatePicker from '../../components/DatePicker.vue'

const props = defineProps({ id: { type: [String, Number], default: null } })
const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const auth = useAuthStore()

const isGuruPage = route.path.startsWith('/guru')
const listPath = isGuruPage ? '/guru/presensi-siswa' : '/admin/presensi-siswa'

const inputCls =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-200'

const statusOptions = [
  { value: 'hadir', label: 'Hadir' },
  { value: 'izin', label: 'Izin' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'libur', label: 'Libur' },
]

const isEdit = computed(() => !!props.id)
const loadingData = ref(true)
const loadError = ref('')
const saving = ref(false)
const lama = ref(null)
const siswaOptions = ref([])
const errors = reactive({})

const form = reactive({
  siswa_id: String(route.query.siswa_id ?? ''),
  tanggal: String(route.query.tanggal || toIso(new Date())),
  status: 'hadir',
  jam_masuk: '',
  jam_shift_mulai: '',
  jam_shift_selesai: '',
  keterangan: '',
})

const perluKeterangan = computed(() => ['izin', 'sakit', 'libur'].includes(form.status))

const berkas = ref(null)
function onBerkas(e) {
  berkas.value = e.target.files?.[0] ?? null
}

const siswaLabel = computed(() => (lama.value?.siswa ? `${lama.value.siswa.nama} · ${lama.value.siswa.nis}` : ''))

const q = ref('')
const open = ref(false)
const selected = computed(() => siswaOptions.value.find((s) => String(s.id) === form.siswa_id) ?? null)
const cocok = computed(() => {
  const term = q.value.trim().toLowerCase()
  return term ? siswaOptions.value.filter((s) => `${s.nama} ${s.nis}`.toLowerCase().includes(term)) : siswaOptions.value
})
const totalCocok = computed(() => cocok.value.length)
const hasil = computed(() => cocok.value.slice(0, 8))

function pilih(s) {
  form.siswa_id = String(s.id)
  q.value = ''
  open.value = false
  delete errors.siswa_id
}

function ganti() {
  form.siswa_id = ''
  q.value = ''
}

async function init() {
  try {
    if (isEdit.value) {
      lama.value = (await api.get(`/api/absensi/${props.id}`)).data.data
      form.tanggal = lama.value.tanggal
      form.status = lama.value.status
      form.jam_masuk = lama.value.jam_masuk ? jamOnly(lama.value.jam_masuk) : ''
      form.jam_shift_mulai = lama.value.jam_shift_mulai ? jamOnly(lama.value.jam_shift_mulai) : ''
      form.jam_shift_selesai = lama.value.jam_shift_selesai ? jamOnly(lama.value.jam_shift_selesai) : ''
      form.keterangan = lama.value.keterangan ?? ''
    } else {
      let lokasi = await fetchAllPages('/api/lokasi-pkl', { status: 'active' })
      if (isGuruPage) lokasi = lokasi.filter((l) => l.guru?.nip === auth.user?.username)
      siswaOptions.value = [...groupBySiswa(lokasi).values()]
        .filter(Boolean)
        .map((l) => ({ ...l.siswa, perusahaan: l.perusahaan?.nama }))
    }
  } catch (e) {
    loadError.value = getErrorMessage(e, 'Gagal memuat data.')
  } finally {
    loadingData.value = false
  }
}

async function submit() {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!isEdit.value && !form.siswa_id) {
    errors.siswa_id = 'Siswa wajib dipilih.'
    return
  }
  if (perluKeterangan.value && !form.keterangan.trim()) {
    errors.keterangan = 'Keterangan wajib diisi untuk status izin/sakit/libur.'
    return
  }
  if (form.jam_shift_mulai && form.jam_shift_selesai && form.jam_shift_selesai <= form.jam_shift_mulai) {
    errors.jam_shift_selesai = 'Jam shift selesai harus setelah jam shift mulai.'
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await api.post(`/api/absensi/${props.id}/koreksi`, {
        status: form.status,
        keterangan: form.keterangan || null,
        jam_masuk: form.jam_masuk || null,
        jam_shift_mulai: form.jam_shift_mulai || null,
        jam_shift_selesai: form.jam_shift_selesai || null,
      })
      toast.show('Presensi berhasil dikoreksi.')
      router.push(`${listPath}/${props.id}`)
    } else {
      const fd = new FormData()
      fd.append('siswa_id', form.siswa_id)
      fd.append('tanggal', form.tanggal)
      fd.append('status', form.status)
      if (form.jam_masuk) fd.append('jam_masuk', form.jam_masuk)
      if (form.jam_shift_mulai) fd.append('jam_shift_mulai', form.jam_shift_mulai)
      if (form.jam_shift_selesai) fd.append('jam_shift_selesai', form.jam_shift_selesai)
      if (form.keterangan.trim()) fd.append('keterangan', form.keterangan)
      if (berkas.value && ['izin', 'sakit'].includes(form.status)) fd.append('berkas_pendukung', berkas.value)
      const res = await api.post('/api/absensi/manual', fd)
      toast.show('Presensi berhasil ditambahkan.')
      router.push(`${listPath}/${res.data.data.id}`)
    }
  } catch (e) {
    const err = e.response?.data?.errors ?? {}
    Object.keys(err).forEach((k) => (errors[k] = err[k][0]))
    if (!Object.keys(err).length) toast.show(getErrorMessage(e, 'Gagal menyimpan presensi.'), 'error')
  } finally {
    saving.value = false
  }
}

onMounted(init)
</script>