<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Guru Pembimbing', to: backTo }, { label: pageTitle }]"
      :title="pageTitle"
      subtitle="Lengkapi identitas guru dan alokasikan siswa bimbingan."
    >
      <router-link
        :to="backTo"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </router-link>
    </PageHeader>

    <p v-if="loadingData" class="py-16 text-center text-sm text-slate-400">Memuat data guru…</p>
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
          </div>

          <template #footer>
            <router-link :to="backTo" class="px-3 text-sm font-semibold text-blue-600">Batal</router-link>
            <button
              type="submit"
              :disabled="saving"
              class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <AppIcon name="save" class="h-4 w-4" />
              {{ saving ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Simpan Data Guru' }}
            </button>
          </template>
        </FormCard>

        <FormCard title="Akun Guru" description="Username login guru selalu sama dengan NIP.">
          <div v-if="!isEdit" class="-my-3">
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

      <FormCard title="Alokasi Siswa" :description="isEdit ? `${alokasi.length} siswa aktif dibimbing.` : 'Diatur setelah guru disimpan.'">
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
            <div class="flex min-w-0 flex-col">
              <span class="truncate text-xs font-semibold text-slate-900">{{ l.siswa?.nama }}</span>
              <span class="truncate text-[11px] text-slate-500">{{ l.perusahaan?.nama ?? '—' }}</span>
            </div>
          </li>
        </ul>
      </FormCard>
    </form>
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

const props = defineProps({ id: { type: String, default: null } })

const router = useRouter()
const isEdit = !!props.id
const pageTitle = isEdit ? 'Edit Guru' : 'Tambah Guru'
const backTo = '/admin/master-data/guru'

const form = reactive({ name: '', nip: '', akun_otomatis: true, password: '', password_confirmation: '' })
const alokasi = ref([])
const loadingData = ref(isEdit)
const loadError = ref('')

const { saving, fieldErrors, save } = useMasterResource('/api/guru', { name: 'Guru', reload: false })

const local = reactive({})
const err = (key) => local[key] || fieldErrors.value[key] || ''
watch(() => form.name, () => delete local.name)
watch(() => form.nip, () => delete local.nip)

const showPassword = computed(() => isEdit || !form.akun_otomatis)

async function loadGuru() {
  try {
    const [g, l] = await Promise.all([
      api.get(`/api/guru/${props.id}`),
      fetchAllPages('/api/lokasi-pkl', { guru_id: props.id }),
    ])
    form.name = g.data.data.user?.name ?? ''
    form.nip = g.data.data.nip ?? ''
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
  const values = { name: form.name.trim(), nip, username: nip }

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

onMounted(() => {
  if (isEdit) loadGuru()
})
</script>