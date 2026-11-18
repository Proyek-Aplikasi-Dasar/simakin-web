<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Akun' }, { label: 'Profil' }]"
      title="Profil Admin"
      subtitle="Informasi akun administrator."
    >
      <router-link
        to="/admin/profil/edit"
        class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold leading-5 text-white hover:bg-blue-700"
      >
        <AppIcon name="pencil" class="h-5 w-5" />
        Edit Profil
      </router-link>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section class="relative overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div class="absolute inset-x-0 top-0 h-14 overflow-hidden bg-blue-600">
          <div class="absolute -top-[90px] right-[60px] h-[180px] w-[180px] rounded-full bg-blue-700/60"></div>
          <div class="absolute right-[-30px] top-2.5 h-[120px] w-[120px] rounded-full bg-blue-700/60"></div>
        </div>
        <div class="relative flex items-end gap-6 px-6 pb-5 pt-7">
          <span class="flex shrink-0 rounded-full bg-white p-1">
            <span class="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <AppIcon name="user" class="h-9 w-9" />
            </span>
          </span>
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <h2 class="truncate text-lg font-semibold leading-[26px] text-slate-900">{{ auth.user?.name ?? '—' }}</h2>
            <p class="text-xs leading-[18px] text-slate-500">Administrator · SMK Negeri 1 Magelang</p>
          </div>
          <span class="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-[3px] text-xs font-semibold leading-4 text-yellow-700">
            <span class="h-1.5 w-1.5 rounded-full bg-yellow-700" />
            Administrator
          </span>
        </div>
        <div class="grid grid-cols-1 gap-6 border-t border-slate-100 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
          <InfoItem icon="mail" label="Email" :value="auth.user?.email" />
          <!-- telp belum ada di tabel users BE -->
          <InfoItem icon="smartphone" label="Nomor Telepon" :value="auth.user?.telp" />
          <InfoItem icon="user" label="Username" :value="auth.user?.username" />
          <InfoItem icon="shield" label="Hak Akses" value="Semua modul" />
        </div>
      </section>

      <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form novalidate @submit.prevent="submit">
          <FormCard title="Ubah Password" description="Perbarui password secara berkala.">
            <div class="flex flex-col gap-5">
              <FormField
                id="current_password"
                v-model="form.current_password"
                type="password"
                label="Password Saat Ini"
                placeholder="Masukkan password saat ini"
                autocomplete="current-password"
                :error="errors.current_password"
              />
              <FormField
                id="password"
                v-model="form.password"
                type="password"
                label="Password Baru"
                placeholder="Minimal 8 karakter"
                hint="Kombinasi huruf dan angka."
                autocomplete="new-password"
                :error="errors.password"
              />
              <FormField
                id="password_confirmation"
                v-model="form.password_confirmation"
                type="password"
                label="Konfirmasi Password Baru"
                placeholder="Ulangi password baru"
                autocomplete="new-password"
                :error="errors.password_confirmation"
              />
            </div>

            <template #footer>
              <button
                type="button"
                :disabled="saving"
                class="flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
                @click="reset"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <AppIcon name="save" class="h-4 w-4" />
                {{ saving ? 'Menyimpan…' : 'Simpan Password' }}
              </button>
            </template>
          </FormCard>
        </form>

        <FormCard title="Informasi Akun" description="Ringkasan akun administrator.">
          <div class="flex flex-col gap-4">
            <InfoItem icon="shield" label="Peran" value="Administrator" />
            <InfoItem icon="calendar" label="Dibuat" :value="dibuat" />
          </div>
        </FormCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import api, { getErrorMessage } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import { formatDate } from '../../utils/siswa'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import InfoItem from '../../components/InfoItem.vue'
import AppIcon from '../../components/AppIcon.vue'

const auth = useAuthStore()
const toast = useToastStore()

const form = reactive({ current_password: '', password: '', password_confirmation: '' })
const errors = reactive({ current_password: '', password: '', password_confirmation: '' })
const saving = ref(false)

const dibuat = computed(() => (auth.user?.created_at ? formatDate(String(auth.user.created_at).slice(0, 10)) : ''))

function clearErrors() {
  Object.keys(errors).forEach((k) => (errors[k] = ''))
}

function reset() {
  Object.keys(form).forEach((k) => (form[k] = ''))
  clearErrors()
}

async function submit() {
  if (saving.value) return
  clearErrors()

  if (!form.current_password) errors.current_password = 'Password saat ini wajib diisi.'
  if (form.password.length < 8) errors.password = 'Password baru minimal 8 karakter.'
  if (form.password !== form.password_confirmation) errors.password_confirmation = 'Konfirmasi password tidak cocok.'
  if (Object.values(errors).some(Boolean)) return

  saving.value = true
  try {
    const { data } = await api.put('/api/user/password', {
      current_password: form.current_password,
      password: form.password,
      password_confirmation: form.password_confirmation,
    })
    toast.show(data.message || 'Password berhasil diubah.')
    reset()
  } catch (err) {
    const status = err.response?.status
    if (status === 422) {
      const e = err.response.data?.errors ?? {}
      errors.current_password = e.current_password?.[0] ?? ''
      errors.password = e.password?.[0] ?? ''
      if (!errors.current_password && !errors.password) toast.show(getErrorMessage(err), 'error')
    } else if (status && status < 500 && ![401, 403, 419, 429].includes(status)) {
      toast.show(getErrorMessage(err), 'error')
    }
  } finally {
    saving.value = false
  }
}
</script>
