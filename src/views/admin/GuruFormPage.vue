<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Guru Pembimbing', to: backTo }, { label: pageTitle }]"
      :title="pageTitle"
      :subtitle="isEdit ? 'Ubah identitas guru dan alokasi siswa bimbingan.' : 'Lengkapi identitas guru dan alokasikan siswa bimbingan.'"
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
        <FormCard title="Identitas Guru" description="Pastikan data sesuai dokumen kepegawaian.">
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField id="name" v-model="form.name" label="Nama Lengkap (beserta gelar)" placeholder="Masukkan nama lengkap" :error="err('name')" />
            <FormField id="nip" v-model="form.nip" label="NIP" placeholder="Masukkan NIP" :error="local.nip || fieldErrors.nip || fieldErrors.username || ''" />
            <FormField v-if="isEdit" id="email" :model-value="form.email" type="email" label="Email" readonly />
            <FormField
              id="telp"
              v-model="form.telp"
              type="tel"
              inputmode="tel"
              label="Nomor Telepon"
              placeholder="Contoh: 081234567890"
              :maxlength="20"
              :error="err('telp')"
            />
            <FormField
              id="jurusan"
              v-model="form.jurusan_id"
              label="Program Studi"
              placeholder="Pilih program studi"
              :options="jurusanOptions"
              :hint="isEdit ? '' : 'Opsional.'"
              :error="err('jurusan_id')"
            />
            <FormField
              id="kuota_bimbingan"
              v-model="form.kuota_bimbingan"
              type="number"
              inputmode="numeric"
              :min="0"
              label="Kuota Bimbingan"
              placeholder="Jumlah maksimal siswa bimbingan"
              suffix="siswa"
              hint="Batas maksimal siswa."
              :error="err('kuota_bimbingan')"
            />
            <FormField
              id="alamat"
              v-model="form.alamat"
              class="md:col-span-2"
              textarea
              :rows="isEdit ? 5 : 3"
              label="Alamat"
              placeholder="Alamat lengkap (opsional)"
              :error="err('alamat')"
            />
            <SwitchRow
              v-model="form.is_active"
              class="md:col-span-2"
              label="Status aktif"
              hint="Guru nonaktif tidak muncul sebagai pilihan pembimbing."
            />
          </div>

          <template #footer>
            <router-link :to="backTo" class="px-3 text-sm font-semibold text-blue-600">Batal</router-link>
            <button
              type="submit"
              :disabled="saving"
              class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <AppIcon name="save" class="h-4 w-4" />
              {{ saving ? 'Menyimpan…' : 'Simpan Data Guru' }}
            </button>
          </template>
        </FormCard>

        <FormCard v-if="!isEdit" title="Akun Guru" description="Username login guru selalu sama dengan NIP.">
          <div class="-my-3">
            <SwitchRow v-model="form.akun_otomatis" label="Buat akun otomatis" hint="Kata sandi awal memakai NIP (minimal 8 karakter)." />
          </div>

          <div v-if="showPassword" :class="['grid grid-cols-1 gap-5 md:grid-cols-2', !isEdit && 'mt-5']">
            <FormField
              id="password"
              v-model="form.password"
              type="password"
              :label="isEdit ? 'Kata Sandi Baru' : 'Kata Sandi'"
              placeholder="Minimal 8 karakter"
              :hint="isEdit ? 'Kosongkan jika tidak ingin mengubah.' : ''"
              :error="local.password || fieldErrors.password || ''"
            />
            <FormField
              id="password_confirmation"
              v-model="form.password_confirmation"
              type="password"
              label="Konfirmasi Kata Sandi"
              placeholder="Ulangi kata sandi"
              :error="local.password_confirmation"
            />
          </div>
        </FormCard>
      </div>

      <FormCard title="Alokasi Siswa" :description="alokasiDeskripsi">
        <template #action>
          <router-link to="/admin/lokasi-penempatan" class="text-xs font-semibold text-blue-600 hover:underline">Tambah</router-link>
        </template>

        <p v-if="!isEdit" class="py-6 text-center text-sm text-slate-400">
          Alokasi siswa dilakukan lewat menu Lokasi &amp; Penempatan.
        </p>
        <p v-else-if="!alokasi.length" class="py-6 text-center text-sm text-slate-400">Belum ada siswa yang dialokasikan.</p>
        <ul v-else class="flex flex-col gap-4">
          <li v-for="l in alokasi" :key="l.id" class="flex items-center gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <AppIcon name="user" class="h-5 w-5" />
            </span>
            <div class="flex min-w-0 flex-1 flex-col">
              <span class="truncate text-xs font-semibold text-slate-900">{{ l.siswa?.nama }}</span>
              <span class="truncate text-[11px] text-slate-500">{{ sublineAlokasi(l) }}</span>
            </div>
            <button
              type="button"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600"
              aria-label="Lepas dari guru ini"
              title="Lepas dari guru ini"
              @click="toLepas = l"
            >
              <AppIcon name="x" class="h-5 w-5" />
            </button>
          </li>
        </ul>
      </FormCard>
    </form>

    <ConfirmDialog
      :show="!!toLepas"
      title="Lepas siswa dari guru ini?"
      :message="`${toLepas?.siswa?.nama ?? 'Siswa'} tidak lagi dibimbing guru ini. Penempatan PKL-nya tetap ada dan guru bisa diatur ulang di menu Lokasi & Penempatan.`"
      :loading="lepasing"
      @cancel="toLepas = null"
      @confirm="confirmLepas"
    />
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api, { getErrorMessage } from '../../services/api'
import { fetchAllPages } from '../../utils/siswa'
import { useMasterResource } from '../../composables/useMasterResource'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import SwitchRow from '../../components/SwitchRow.vue'
import AppIcon from '../../components/AppIcon.vue'
import PageSkeleton from '../../components/PageSkeleton.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { useToastStore } from '../../stores/toast'

const props = defineProps({ id: { type: String, default: null } })

const router = useRouter()
const toast = useToastStore()
const isEdit = !!props.id
const pageTitle = isEdit ? 'Edit Guru' : 'Tambah Guru'
const backTo = '/admin/master-data/guru'

const form = reactive({
  name: '',
  nip: '',
  email: '',
  telp: '',
  jurusan_id: 'none',
  kuota_bimbingan: '',
  alamat: '',
  is_active: true,
  akun_otomatis: true,
  password: '',
  password_confirmation: '',
})
const jurusanOptions = ref([{ value: 'none', label: 'Belum ditentukan' }])
const alokasi = ref([])
const kelasById = ref(new Map())
const toLepas = ref(null)
const lepasing = ref(false)
const loadingData = ref(isEdit)
const loadError = ref('')

const { saving, fieldErrors, save } = useMasterResource('/api/guru', { name: 'Guru', reload: false })

const local = reactive({})
const err = (key) => local[key] || fieldErrors.value[key] || ''
watch(() => form.name, () => delete local.name)
watch(() => form.nip, () => delete local.nip)

const showPassword = computed(() => isEdit || !form.akun_otomatis)

const alokasiDeskripsi = computed(() => {
  if (!isEdit) return 'Diatur setelah guru disimpan.'
  const n = alokasi.value.length
  return form.kuota_bimbingan !== '' ? `${n} dari ${form.kuota_bimbingan} kuota terisi.` : `${n} siswa aktif dibimbing.`
})

const sublineAlokasi = (l) =>
  [kelasById.value.get(l.siswa?.id), l.perusahaan?.nama].filter(Boolean).join(' · ') || '—'

async function loadGuru() {
  try {
    const [g, l, s] = await Promise.all([
      api.get(`/api/guru/${props.id}`),
      fetchAllPages('/api/lokasi-pkl', { guru_id: props.id }),
      fetchAllPages('/api/siswa').catch(() => []),
    ])
    kelasById.value = new Map(s.filter((x) => x.kelas).map((x) => [x.id, x.kelas]))
    form.name = g.data.data.user?.name ?? ''
    form.nip = g.data.data.nip ?? ''
    form.email = g.data.data.user?.email ?? ''
    form.telp = g.data.data.telp ?? ''
    form.jurusan_id = g.data.data.jurusan_id ? String(g.data.data.jurusan_id) : 'none'
    form.kuota_bimbingan = g.data.data.kuota_bimbingan != null ? String(g.data.data.kuota_bimbingan) : ''
    form.alamat = g.data.data.alamat ?? ''
    form.is_active = g.data.data.is_active == null ? true : !!g.data.data.is_active
    alokasi.value = l.filter((x) => x.status === 'active')
  } catch (e) {
    loadError.value = getErrorMessage(e, 'Gagal memuat data guru.')
  } finally {
    loadingData.value = false
  }
}

function validate() {
  Object.keys(local).forEach((k) => delete local[k])
  const nip = form.nip.trim()

  if (!form.name.trim()) local.name = 'Kolom ini wajib diisi'
  if (!nip) local.nip = 'Kolom ini wajib diisi'
  if (form.kuota_bimbingan !== '' && !/^\d+$/.test(String(form.kuota_bimbingan))) {
    local.kuota_bimbingan = 'Kuota harus berupa bilangan bulat 0 atau lebih.'
  }

  if (!isEdit && form.akun_otomatis) {
    if (nip && nip.length < 8) {
      local.nip = 'NIP minimal 8 karakter agar bisa jadi kata sandi awal. Matikan "Buat akun otomatis" untuk mengisi sendiri.'
    }
  } else if (!isEdit || form.password || form.password_confirmation) {
    if (form.password.length < 8) local.password = 'Kata sandi minimal 8 karakter.'
    if (form.password !== form.password_confirmation) local.password_confirmation = 'Konfirmasi kata sandi tidak cocok.'
  }

  return Object.keys(local).length === 0
}

async function submit() {
  if (saving.value || !validate()) return

  const nip = form.nip.trim()
  const values = {
    name: form.name.trim(),
    nip,
    username: nip,
    telp: form.telp.trim() || null,
    jurusan_id: form.jurusan_id === 'none' ? null : Number(form.jurusan_id),
    kuota_bimbingan: form.kuota_bimbingan === '' ? null : Number(form.kuota_bimbingan),
    alamat: form.alamat.trim() || null,
    is_active: form.is_active,
  }

  if (!isEdit && form.akun_otomatis) {
    values.password = nip
    values.password_confirmation = nip
  } else if (form.password) {
    values.password = form.password
    values.password_confirmation = form.password_confirmation
  }

  const ok = await save({ mode: isEdit ? 'edit' : 'create', row: { id: props.id }, values })
  if (ok) router.push(backTo)
}

async function confirmLepas() {
  const target = toLepas.value
  if (!target || lepasing.value) return
  lepasing.value = true
  try {
    await api.put(`/api/lokasi-pkl/${target.id}`, { guru_id: null })
    toast.show(`${target.siswa?.nama ?? 'Siswa'} tidak lagi dibimbing guru ini.`)
    alokasi.value = alokasi.value.filter((x) => x.id !== target.id)
  } catch (err) {
    const status = err.response?.status
    if (status && status < 500 && ![401, 403, 419, 429].includes(status)) {
      toast.show(getErrorMessage(err), 'error')
    }
  } finally {
    lepasing.value = false
    toLepas.value = null
  }
}

async function loadJurusan() {
  try {
    const list = await fetchAllPages('/api/jurusan')
    jurusanOptions.value = [
      { value: 'none', label: 'Belum ditentukan' },
      ...list.map((j) => ({ value: String(j.id), label: j.kode ? `${j.nama} (${j.kode})` : j.nama })),
    ]
  } catch {
  }
}

onMounted(() => {
  loadJurusan()
  if (isEdit) loadGuru()
})
</script>