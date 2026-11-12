<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Presensi Siswa', to: '/admin/presensi-siswa' }, { label: isEdit ? 'Edit Presensi' : 'Tambah Presensi' }]"
      :title="isEdit ? 'Edit Presensi' : 'Tambah Presensi'"
      :subtitle="isEdit ? 'Perbarui presensi siswa yang sudah tercatat.' : 'Catat presensi manual untuk siswa yang belum presensi.'"
    >
      <router-link
        to="/admin/presensi-siswa"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </router-link>
    </PageHeader>

    <p v-if="loadingData" class="py-16 text-center text-sm text-slate-400">Memuat data…</p>
    <div v-else-if="loadError" class="py-16 text-center text-sm text-red-600">{{ loadError }}</div>

    <div v-else class="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
      <form novalidate @submit.prevent="submit">
        <FormCard title="Form Presensi" description="Satu presensi per hari, sama seperti form di aplikasi siswa.">
          <div class="flex flex-col gap-5">
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Siswa</label>
                <input v-if="isEdit" :value="siswaLabel" disabled :class="[inputCls, 'bg-slate-50']" />
                <select v-else v-model="form.siswa_id" :class="inputCls">
                  <option value="">Pilih siswa</option>
                  <option v-for="s in siswaOptions" :key="s.id" :value="String(s.id)">{{ s.nama }} · {{ s.nis }}</option>
                </select>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Tanggal</label>
                <input v-model="form.tanggal" type="date" :disabled="isEdit" :class="[inputCls, isEdit ? 'bg-slate-50' : '']" />
              </div>
            </div>

            <RadioCardGroup id="status-presensi" v-model="form.status" label="Status Kehadiran" :options="statusOptions" :error="errors.status" />

            <div class="max-w-xs">
              <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Jam Masuk</label>
              <input v-model="form.jam_masuk" type="time" :class="inputCls" />
              <p v-if="errors.jam_masuk" class="mt-1 text-xs text-red-600">{{ errors.jam_masuk }}</p>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Keterangan</label>
              <textarea
                v-model="form.keterangan"
                rows="5"
                placeholder="Masukkan keterangan"
                :class="[inputCls, 'h-auto py-3']"
              ></textarea>
              <p v-if="errors.keterangan" class="mt-1 text-xs text-red-600">{{ errors.keterangan }}</p>
            </div>
          </div>

          <template #footer>
            <router-link to="/admin/presensi-siswa" class="px-3 text-sm font-semibold text-blue-600 hover:underline">Batal</router-link>
            <button
              type="submit"
              :disabled="saving || !isEdit"
              :title="isEdit ? '' : 'Tambah presensi manual belum tersedia'"
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
import { fetchAllPages, groupBySiswa, jamOnly, toIso } from '../../utils/siswa'
import { PRESENSI_STATUS } from '../../utils/presensi'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import InfoItem from '../../components/InfoItem.vue'
import InfoAlert from '../../components/InfoAlert.vue'
import RadioCardGroup from '../../components/RadioCardGroup.vue'
import AppIcon from '../../components/AppIcon.vue'

const props = defineProps({ id: { type: [String, Number], default: null } })
const route = useRoute()
const router = useRouter()
const toast = useToastStore()

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
  tanggal: String(route.query.tanggal ?? toIso(new Date())),
  status: 'hadir',
  jam_masuk: '',
  keterangan: '',
})

const siswaLabel = computed(() => (lama.value?.siswa ? `${lama.value.siswa.nama} · ${lama.value.siswa.nis}` : ''))

async function init() {
  try {
    if (isEdit.value) {
      lama.value = (await api.get(`/api/absensi/${props.id}`)).data.data
      form.tanggal = lama.value.tanggal
      form.status = lama.value.status
      form.jam_masuk = lama.value.jam_masuk ? jamOnly(lama.value.jam_masuk) : ''
      form.keterangan = lama.value.keterangan ?? ''
    } else {
      const lokasi = await fetchAllPages('/api/lokasi-pkl', { status: 'active' })
      siswaOptions.value = [...groupBySiswa(lokasi).values()].filter(Boolean).map((l) => l.siswa)
    }
  } catch (e) {
    loadError.value = getErrorMessage(e, 'Gagal memuat data.')
  } finally {
    loadingData.value = false
  }
}

async function submit() {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.keterangan.trim()) {
    errors.keterangan = 'Keterangan wajib diisi.'
    return
  }
  saving.value = true
  try {
    await api.post(`/api/absensi/${props.id}/koreksi`, {
      status: form.status,
      keterangan: form.keterangan,
      jam_masuk: form.jam_masuk || null,
    })
    toast.show('Presensi berhasil dikoreksi.')
    router.push(`/admin/presensi-siswa/${props.id}`)
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