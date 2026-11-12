<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Akun & Peran', to: backTo }, { label: pageTitle }]"
      :title="pageTitle"
      :subtitle="
        isEdit
          ? 'Ubah identitas, peran, hak akses, atau kata sandi pengguna.'
          : 'Atur identitas, peran, dan hak akses pengguna baru.'
      "
    >
      <router-link
        :to="backTo"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </router-link>
    </PageHeader>

    <form class="flex flex-col gap-6" novalidate @submit.prevent="submit">
      <FormCard title="Informasi Akun" description="Data identitas pengguna.">
        <div class="flex flex-col gap-5">
          <InfoAlert
            title="Akun dibuat otomatis"
            text="Username dan password awal memakai NIP untuk guru, atau NIS untuk siswa."
          />
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              id="nama"
              v-model="form.nama"
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap"
              :error="errors.nama"
            />
            <FormField
              id="nip"
              v-model="form.nip"
              label="NIP / NIS"
              placeholder="Masukkan NIP / NIS"
              hint="Otomatis jadi username dan password awal."
              :error="errors.nip"
              :disabled="isEdit"
            />
            <FormField
              v-if="isEdit"
              id="email"
              v-model="form.email"
              type="email"
              label="Email"
              placeholder="Masukkan email"
              :error="errors.email"
            />
          </div>
          <RadioCardGroup
            id="role"
            v-model="form.role"
            label="Peran Pengguna"
            :options="roleOptions"
            :hint="isEdit ? '' : 'Akun siswa dibuat lewat menu Siswa PKL.'"
            :error="errors.role"
            :disabled="isEdit"
          />
        </div>
        <template #footer>
          <router-link :to="backTo" class="px-3 text-sm font-semibold text-blue-600">Batal</router-link>
          <button
            type="submit"
            :disabled="saving || loading"
            class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <AppIcon name="save" class="h-4 w-4" />
            {{ saving ? 'Menyimpan...' : 'Simpan Akun' }}
          </button>
        </template>
      </FormCard>

      <FormCard
        v-if="isEdit"
        title="Ubah Kata Sandi"
        description="Isi hanya jika ingin mengganti kata sandi pengguna."
      >
        <div class="flex flex-col gap-5">
          <InfoAlert
            title="Kosongkan jika tidak ingin mengubah"
            text="Pengguna bisa login dengan kata sandi baru segera setelah disimpan."
          />
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              id="password"
              v-model="form.password"
              type="password"
              label="Kata Sandi Baru"
              placeholder="Minimal 8 karakter"
              :error="pwErrors.password"
            />
            <FormField
              id="password_confirmation"
              v-model="form.passwordConfirmation"
              type="password"
              label="Konfirmasi Kata Sandi Baru"
              placeholder="Ulangi kata sandi baru"
              hint="Harus sama dengan kata sandi baru."
              :error="pwErrors.confirmation"
            />
          </div>
        </div>
        <template #footer>
            <router-link :to="backTo" class="px-3 text-sm font-semibold text-blue-600">Batal</router-link>
            <button
              type="button"
              :disabled="pwSaving"
              class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              @click="submitPassword"
            >
              <AppIcon name="save" class="h-4 w-4" />
              {{ pwSaving ? 'Menyimpan...' : 'Simpan Kata Sandi' }}
            </button>
        </template>
      </FormCard>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import InfoAlert from '../../components/InfoAlert.vue'
import RadioCardGroup from '../../components/RadioCardGroup.vue'
import AppIcon from '../../components/AppIcon.vue'
import api, { getErrorMessage } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import { useMasterResource } from '../../composables/useMasterResource'
import { ROLE_ID_BY_NAME, ROLE_MAP } from '../../constants/roles'

const props = defineProps({
  id: { type: String, default: null },
})

const router = useRouter()
const toast = useToastStore()
const isEdit = !!props.id
const pageTitle = isEdit ? 'Edit Akun' : 'Tambah Akun'
const backTo = '/admin/akun-peran'

const form = reactive({
  nama: '',
  nip: '',
  email: '',
  role: 'guru',
  password: '',
  passwordConfirmation: '',
})

const roleOptions = computed(() => [
  { value: 'admin', label: 'Administrator' },
  { value: 'guru', label: 'Guru Pembimbing' },
  { value: 'siswa', label: 'Siswa', disabled: !isEdit },
])

const { saving, fieldErrors, save } = useMasterResource(isEdit ? '/api/users' : '/api/register', {
  name: 'Akun',
  reload: false,
})

const loading = ref(false)
const pwSaving = ref(false)
const localErrors = reactive({ nama: '', nip: '' })
const pwErrors = reactive({ password: '', confirmation: '' })

watch(() => form.nama, () => (localErrors.nama = ''))
watch(() => form.nip, () => (localErrors.nip = ''))
watch(() => form.password, () => (pwErrors.password = ''))
watch(() => form.passwordConfirmation, () => (pwErrors.confirmation = ''))

const errors = computed(() => ({
  nama: localErrors.nama || fieldErrors.value.name || '',
  nip: localErrors.nip || fieldErrors.value.username || fieldErrors.value.password || '',
  email: fieldErrors.value.email || '',
  role: fieldErrors.value.role_id || '',
}))

async function loadUser() {
  loading.value = true
  try {
    const { data } = await api.get(`/api/users/${props.id}`)
    const u = data.data ?? data
    form.nama = u.name ?? ''
    form.nip = u.guru?.nip ?? u.siswa?.nis ?? u.username ?? ''
    form.email = u.email ?? ''
    form.role = ROLE_MAP[u.role_id] ?? 'guru'
  } catch (err) {
    toast.show(getErrorMessage(err, 'Gagal memuat data akun.'), 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (isEdit) loadUser()
})

async function submit() {
  if (saving.value || loading.value) return
  if (isEdit) return submitEdit()

  localErrors.nama = form.nama.trim() ? '' : 'Kolom ini wajib diisi'
  localErrors.nip = form.nip.trim() ? '' : 'Kolom ini wajib diisi'
  if (localErrors.nama || localErrors.nip) return

  const nip = form.nip.trim()
  const ok = await save({
    mode: 'create',
    row: null,
    values: {
      name: form.nama.trim(),
      username: nip,
      password: nip,
      password_confirmation: nip,
      role_id: ROLE_ID_BY_NAME[form.role],
    },
  })
  if (ok) router.push(backTo)
}

async function submitEdit() {
  localErrors.nama = form.nama.trim() ? '' : 'Kolom ini wajib diisi'
  if (localErrors.nama) return

  const ok = await save({
    mode: 'edit',
    row: { id: props.id },
    values: {
      name: form.nama.trim(),
      email: form.email.trim() || null,
    },
  })
  if (ok) router.push(backTo)
}

async function submitPassword() {
  if (pwSaving.value) return

  pwErrors.password = form.password.length >= 8 ? '' : 'Kata sandi minimal 8 karakter.'
  pwErrors.confirmation =
    form.password === form.passwordConfirmation ? '' : 'Konfirmasi kata sandi tidak cocok.'
  if (pwErrors.password || pwErrors.confirmation) return

  pwSaving.value = true
  try {
    const { data } = await api.put(`/api/users/${props.id}/password`, {
      password: form.password,
      password_confirmation: form.passwordConfirmation,
    })
    toast.show(data.message || 'Kata sandi berhasil direset.')
    form.password = ''
    form.passwordConfirmation = ''
  } catch (err) {
    const status = err.response?.status
    if (status === 422) {
      const e = err.response.data?.errors ?? {}
      pwErrors.password = e.password?.[0] ?? getErrorMessage(err, 'Data tidak valid.')
    } else if (status && status < 500 && ![401, 403, 419, 429].includes(status)) {
      toast.show(getErrorMessage(err), 'error')
    }
  } finally {
    pwSaving.value = false
  }
}
</script>