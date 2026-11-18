<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Siswa PKL', to: backTo }, { label: pageTitle }]"
      :title="pageTitle"
      subtitle="Data pokok siswa, orang tua / wali, akademik, dan akun login."
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
      <router-link :to="backTo" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50">
        Kembali ke daftar
      </router-link>
    </div>

    <form v-else class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" novalidate @submit.prevent="submit">
      <div class="flex flex-col gap-6">
        <FormCard title="Data Pribadi" description="Sama dengan data yang dilengkapi siswa di aplikasi.">
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField id="name" v-model="form.name" label="Nama Lengkap" placeholder="Masukkan nama lengkap" :error="err('name')" @blur="touch('name')" />
            <FormField id="nis" v-model="form.nis" label="NIS" placeholder="Masukkan NIS" :error="errorOf('nis') || fieldErrors.username || ''" @blur="touch('nis')" />
            <FormField
              id="nisn"
              v-model="form.nisn"
              inputmode="numeric"
              label="NISN"
              placeholder="Masukkan NISN (opsional)"
              :maxlength="20"
              :error="err('nisn')"
            />
            <FormField
              id="tempat_lahir"
              v-model="form.tempat_lahir"
              label="Tempat Lahir"
              placeholder="Contoh: Magelang"
              :maxlength="100"
              :error="err('tempat_lahir')"
            />
            <FormField
              id="tanggal_lahir"
              v-model="form.tanggal_lahir"
              type="date"
              label="Tanggal Lahir"
              :max="today"
              :error="err('tanggal_lahir')"
            />
            <FormField
              id="jenis_kelamin"
              v-model="form.jenis_kelamin"
              label="Jenis Kelamin"
              placeholder="Pilih jenis kelamin"
              :options="jenisKelamin"
              :error="err('jenis_kelamin')"
            />
            <FormField id="email" v-model="form.email" type="email" label="Email" placeholder="Masukkan email" :error="err('email')" />
            <FormField id="telp" v-model="form.telp" label="Nomor HP" placeholder="Masukkan nomor HP" :error="err('telp')" />
            <div class="md:col-span-2">
              <FormField id="alamat" v-model="form.alamat" textarea :rows="5" label="Alamat" placeholder="Masukkan alamat" :error="err('alamat')" />
            </div>
          </div>
        </FormCard>

        <FormCard title="Data Orang Tua / Wali" description="Cukup satu orang tua atau wali.">
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField id="nama_ortu" v-model="form.nama_ortu" label="Nama Orang Tua / Wali" placeholder="Masukkan nama" :error="err('nama_ortu')" />
            <FormField id="telp_ortu" v-model="form.telp_ortu" label="Nomor HP" placeholder="Masukkan nomor HP" :error="err('telp_ortu')" />
            <div class="md:col-span-2">
              <FormField
                id="alamat_ortu"
                v-model="form.alamat_ortu"
                textarea
                :rows="5"
                label="Alamat Orang Tua / Wali (opsional)"
                placeholder="Masukkan alamat"
                hint="Boleh dikosongkan. Siswa dapat melengkapi sendiri dari aplikasi."
                :error="err('alamat_ortu')"
              />
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
              {{ saving ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Simpan Data Siswa' }}
            </button>
          </template>
        </FormCard>
      </div>

      <div class="flex flex-col gap-6">
        <FormCard title="Alokasi PKL" description="Bisa diisi nanti lewat menu Lokasi & Penempatan.">
          <div class="flex flex-col gap-5">
            <FormField id="perusahaan_id" v-model="form.perusahaan_id" label="Tempat PKL" placeholder="Pilih tempat PKL" searchable :options="perusahaanOptions" />
            <FormField id="guru_id" v-model="form.guru_id" label="Guru Pembimbing" placeholder="Pilih guru pembimbing" searchable :options="guruOptions" />
            <FormField id="periode_id" v-model="form.periode_id" label="Periode" placeholder="Pilih periode" :options="periodeOptions" :error="placeError" />
          </div>
        </FormCard>

        <FormCard title="Akademik" description="Kelas, jurusan, dan gelombang siswa.">
          <div class="flex flex-col gap-5">
            <FormField id="kelas" v-model="form.kelas" label="Kelas" placeholder="Contoh: XII RPL 1" :error="err('kelas')" />
            <FormField
              id="jurusan_id"
              v-model="form.jurusan_id"
              label="Jurusan"
              placeholder="Pilih jurusan"
              :options="jurusanOptions"
              :error="err('jurusan_id')"
            />
            <FormField
              id="gelombang_id"
              v-model="form.gelombang_id"
              label="Gelombang PKL"
              placeholder="Pilih gelombang"
              :options="gelombangOptions"
              :error="err('gelombang_id')"
            />
            <SwitchRow
              v-model="form.is_active"
              label="Status aktif"
              hint="Siswa nonaktif tidak muncul dalam daftar penempatan baru."
            />
          </div>
        </FormCard>

        <FormCard title="Akun Siswa" description="Username login siswa selalu sama dengan NIS.">
          <div class="-my-3">
            <SwitchRow v-if="!isEdit" v-model="form.akun_otomatis" label="Buat akun otomatis" hint="Username dan password awal memakai NIS." />
            <SwitchRow :model-value="false" disabled label="Wajib ganti password" hint="Belum tersedia di sistem." />
          </div>

          <button
            v-if="isEdit"
            type="button"
            :disabled="!canReset"
            :title="canReset ? '' : 'NIS minimal 8 karakter agar bisa dijadikan kata sandi.'"
            class="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            @click="showReset = true"
          >
            <AppIcon name="key-round" class="h-4 w-4" />
            Reset Password ke NIS
          </button>

          <div v-if="showPassword" :class="['flex flex-col gap-5', !isEdit && 'mt-5']">
            <FormField
              id="password"
              v-model="form.password"
              type="password"
              :label="isEdit ? 'Kata Sandi Baru' : 'Kata Sandi'"
              placeholder="Minimal 8 karakter"
              :hint="isEdit ? 'Kosongkan jika tidak ingin mengubah.' : ''"
              :error="errorOf('password')"
            />
            <FormField
              id="password_confirmation"
              v-model="form.password_confirmation"
              type="password"
              label="Konfirmasi Kata Sandi"
              placeholder="Ulangi kata sandi"
              :error="errorOf('password_confirmation')"
            />
          </div>
        </FormCard>
      </div>
    </form>

    <ConfirmDialog
      :show="showReset"
      title="Reset password ke NIS?"
      message="Kata sandi siswa akan diganti dengan NIS-nya dan semua sesi login siswa dikeluarkan."
      :loading="resetting"
      @cancel="showReset = false"
      @confirm="resetPassword"
    />
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api, { getErrorMessage } from '../../services/api'
import { fetchAllPages, toIso, formatDate } from '../../utils/siswa'
import { useToastStore } from '../../stores/toast'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { useMasterResource } from '../../composables/useMasterResource'
import { useFormValidation } from '../../composables/useFormValidation'
import { required } from '../../utils/validators'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import SwitchRow from '../../components/SwitchRow.vue'
import AppIcon from '../../components/AppIcon.vue'
import PageSkeleton from '../../components/PageSkeleton.vue'

const props = defineProps({
  id: { type: String, default: null },
})

const router = useRouter()
const isEdit = !!props.id
const pageTitle = isEdit ? 'Edit Siswa' : 'Tambah Siswa'
const backTo = '/admin/master-data/siswa'

const jenisKelamin = [
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' },
]

const form = reactive({
  name: '',
  nis: '',
  nisn: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  is_active: true,
  kelas: '',
  jenis_kelamin: '',
  email: '',
  telp: '',
  alamat: '',
  nama_ortu: '',
  telp_ortu: '',
  alamat_ortu: '',
  jurusan_id: '',
  gelombang_id: '',
  perusahaan_id: '',
  guru_id: 'none',
  periode_id: '',
  akun_otomatis: true,
  password: '',
  password_confirmation: '',
})

const today = toIso(new Date()) 
const toast = useToastStore()
const jurusanOptions = ref([])
const gelombangOptions = ref([])
const perusahaanOptions = ref([])
const guruOptions = ref([])
const periodeOptions = ref([])
const placeError = ref('')
const lokasiAktif = ref(null)
const userId = ref(null)
const nisAsli = ref('')
const showReset = ref(false)
const resetting = ref(false)
const canReset = computed(() => nisAsli.value.trim().length >= 8 && !!userId.value)
const loadingData = ref(isEdit)
const loadError = ref('')

const { saving, fieldErrors, save } = useMasterResource('/api/siswa', { name: 'Siswa', reload: false })

const REQUIRED = 'Kolom ini wajib diisi'
const autoAccount = (f) => !isEdit && f.akun_otomatis
const needsPassword = (f) => !autoAccount(f) && (!isEdit || !!f.password || !!f.password_confirmation)

const { errorOf, validate, touch } = useFormValidation(
  form,
  {
    name: [required(REQUIRED)],
    nis: [
      required(REQUIRED),
      (v, f) =>
        autoAccount(f) && v.trim().length < 8
          ? 'NIS minimal 8 karakter agar bisa jadi kata sandi awal. Matikan "Buat akun otomatis" untuk mengisi sendiri.'
          : '',
    ],
    password: [(v, f) => (needsPassword(f) && v.length < 8 ? 'Kata sandi minimal 8 karakter.' : '')],
    password_confirmation: [
      (v, f) => (needsPassword(f) && v !== f.password ? 'Konfirmasi kata sandi tidak cocok.' : ''),
    ],
  },
  { external: () => fieldErrors.value }
)
const err = (key) => errorOf(key)

const showPassword = computed(() => !isEdit && !form.akun_otomatis)

const text = (v) => (v ?? '').toString().trim() || null
const num = (v) => (v ? Number(v) : null)

async function loadOptions() {
  const [j, g, p, gr] = await Promise.allSettled([
    fetchAllPages('/api/jurusan'),
    fetchAllPages('/api/gelombang'),
    fetchAllPages('/api/perusahaan'),
    fetchAllPages('/api/guru'),
  ])
  const ok = (r) => (r.status === 'fulfilled' ? r.value : [])
  const gel = ok(g)
  jurusanOptions.value = ok(j).map((x) => ({ value: String(x.id), label: x.kode ? `${x.kode} — ${x.nama}` : x.nama }))
  gelombangOptions.value = gel.map((x) => ({ value: String(x.id), label: `${x.nama} · ${x.tahun_ajaran}` }))
  periodeOptions.value = gel.map((x) => ({
    value: String(x.id),
    label: `${x.nama} · ${formatDate(x.praktik_mulai)} – ${formatDate(x.praktik_selesai)}`,
  }))
  perusahaanOptions.value = ok(p).map((x) => ({ value: String(x.id), label: x.nama }))
  guruOptions.value = [
    { value: 'none', label: 'Belum ditentukan' },
    ...ok(gr).map((x) => ({ value: String(x.id), label: `${x.user?.name ?? '—'} (${x.nip})` })),
  ]
}

async function loadSiswa() {
  try {
    const { data } = await api.get(`/api/siswa/${props.id}`)
    const s = data.data
    Object.assign(form, {
      name: s.user?.name ?? '',
      nis: s.nis ?? '',
      nisn: s.nisn ?? '',
      tempat_lahir: s.tempat_lahir ?? '',
      tanggal_lahir: s.tanggal_lahir ? String(s.tanggal_lahir).slice(0, 10) : '',
      is_active: s.is_active == null ? true : !!s.is_active,
      kelas: s.kelas ?? '',
      jenis_kelamin: s.jenis_kelamin ?? '',
      email: s.user?.email ?? '',
      telp: s.telp ?? '',
      alamat: s.alamat ?? '',
      nama_ortu: s.nama_ortu ?? '',
      telp_ortu: s.telp_ortu ?? '',
      alamat_ortu: s.alamat_ortu ?? '',
      jurusan_id: s.jurusan?.id ? String(s.jurusan.id) : '',
      gelombang_id: s.gelombang?.id ? String(s.gelombang.id) : '',
    })
    userId.value = s.user?.id ?? null
    nisAsli.value = s.nis ?? ''
    try {
      const { data: lok } = await api.get(`/api/siswa/${props.id}/lokasi-pkl`)
      const aktif = (lok.data ?? []).find((l) => l.status === 'active')
      if (aktif) {
        lokasiAktif.value = aktif
        form.perusahaan_id = aktif.perusahaan ? String(aktif.perusahaan.id) : ''
        form.guru_id = aktif.guru ? String(aktif.guru.id) : 'none'
        form.periode_id = aktif.gelombang ? String(aktif.gelombang.id) : ''
      }
    } catch {
    }
  } catch (e) {
    loadError.value = getErrorMessage(e, 'Gagal memuat data siswa.')
  } finally {
    loadingData.value = false
  }
}

async function submit() {
  if (saving.value || !validate()) return

  const nis = form.nis.trim()
  const values = {
    name: form.name.trim(),
    nis,
    username: nis,
    nisn: text(form.nisn),
    tempat_lahir: text(form.tempat_lahir),
    tanggal_lahir: form.tanggal_lahir || null,
    is_active: form.is_active,
    email: text(form.email),
    jurusan_id: num(form.jurusan_id),
    gelombang_id: num(form.gelombang_id),
    jenis_kelamin: form.jenis_kelamin || null,
    kelas: text(form.kelas),
    telp: text(form.telp),
    alamat: text(form.alamat),
    nama_ortu: text(form.nama_ortu),
    telp_ortu: text(form.telp_ortu),
    alamat_ortu: text(form.alamat_ortu),
  }

  if (!isEdit && form.akun_otomatis) {
    values.password = nis
    values.password_confirmation = nis
  } else if (form.password) {
    values.password = form.password
    values.password_confirmation = form.password_confirmation
  }

  placeError.value = ''
  if (form.perusahaan_id && !(form.periode_id || form.gelombang_id)) {
    placeError.value = 'Pilih periode untuk penempatan.'
    return
  }

  const ok = await save({ mode: isEdit ? 'edit' : 'create', row: { id: props.id }, values })
  if (!ok) return
  if (form.perusahaan_id) await simpanPenempatan(nis)
  router.push(backTo)
}

async function cariSiswaId(nis) {
  const { data } = await api.get('/api/siswa', { params: { search: nis } })
  return (data.data ?? []).find((x) => x.nis === nis)?.id ?? null
}

async function simpanPenempatan(nis) {
  const payload = {
    perusahaan_id: Number(form.perusahaan_id),
    guru_id: form.guru_id === 'none' ? null : Number(form.guru_id),
    gelombang_id: Number(form.periode_id || form.gelombang_id),
  }
  try {
    if (lokasiAktif.value) {
      await api.put(`/api/lokasi-pkl/${lokasiAktif.value.id}`, payload)
    } else {
      const siswaId = isEdit ? props.id : await cariSiswaId(nis)
      if (!siswaId) throw new Error('Siswa tidak ditemukan.')
      await api.post('/api/lokasi-pkl', { ...payload, siswa_id: Number(siswaId) })
    }
  } catch (e) {
    toast.show(`Data siswa tersimpan, tetapi penempatan gagal: ${getErrorMessage(e, 'atur lewat menu Lokasi & Penempatan.')}`, 'error')
  }
}

async function resetPassword() {
  const pw = nisAsli.value.trim()
  if (resetting.value || !userId.value || pw.length < 8) return
  resetting.value = true
  try {
    const { data } = await api.put(`/api/users/${userId.value}/password`, {
      password: pw,
      password_confirmation: pw,
    })
    toast.show(data.message || 'Kata sandi direset ke NIS.')
  } catch (e) {
    const status = e.response?.status
    if (status && status < 500 && ![401, 403, 419, 429].includes(status)) {
      toast.show(getErrorMessage(e), 'error')
    }
  } finally {
    resetting.value = false
    showReset.value = false
  }
}

onMounted(async () => {
  await loadOptions()
  if (isEdit) await loadSiswa()
})
</script>