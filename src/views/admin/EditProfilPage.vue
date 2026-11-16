<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Akun' }, { label: 'Edit Profil' }]"
      title="Edit Profil"
      subtitle="Perbarui informasi akun administrator."
    >
      <router-link
        to="/admin/profil"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </router-link>
    </PageHeader>

    <form class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" novalidate @submit.prevent="submit">
      <FormCard title="Informasi Profil" description="Data yang tampil di profil administrator.">
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField
            id="name"
            v-model="form.name"
            label="Nama Lengkap"
            placeholder="Masukkan nama lengkap"
            :error="localError || fieldErrors.name || ''"
          />
          <FormField
            id="email"
            v-model="form.email"
            type="email"
            label="Email"
            placeholder="Masukkan email"
            :error="fieldErrors.email || ''"
          />
          <div class="md:col-span-2">
            <!-- Kolom telepon belum ada di tabel users BE, jadi belum bisa disimpan -->
            <FormField
              id="telp"
              v-model="form.telp"
              type="tel"
              label="Nomor Telepon"
              placeholder="Menunggu kolom dari BE"
              hint="Belum bisa disimpan: kolom nomor telepon belum ada di BE."
              disabled
            />
          </div>
        </div>

        <template #footer>
          <router-link to="/admin/profil" class="px-3 text-sm font-semibold text-blue-600">Batal</router-link>
          <button
            type="submit"
            :disabled="saving"
            class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <AppIcon name="save" class="h-4 w-4" />
            {{ saving ? 'Menyimpan…' : 'Simpan Perubahan' }}
          </button>
        </template>
      </FormCard>

      <FormCard title="Akun">
        <div class="flex flex-col gap-4">
          <InfoItem icon="user" label="Username" :value="auth.user?.username" />
          <InfoItem icon="shield" label="Peran" value="Administrator" />
        </div>
      </FormCard>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { useMasterResource } from '../../composables/useMasterResource'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import InfoItem from '../../components/InfoItem.vue'
import AppIcon from '../../components/AppIcon.vue'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  name: auth.user?.name ?? '',
  email: auth.user?.email ?? '',
  telp: '',
})
const localError = ref('')

const { saving, fieldErrors, save } = useMasterResource('/api/users', { name: 'Profil', reload: false })

async function submit() {
  if (saving.value || !auth.user) return
  localError.value = form.name.trim() ? '' : 'Nama wajib diisi.'
  if (localError.value) return

  const ok = await save({
    mode: 'edit',
    row: { id: auth.user.id },
    values: { name: form.name.trim(), email: form.email.trim() || null },
  })
  if (!ok) return

  // Segarkan data akun di store supaya nama di header dan sidebar ikut berubah
  const { data } = await api.get('/api/user')
  auth.setUser(data)
  router.push('/admin/profil')
}
</script>
