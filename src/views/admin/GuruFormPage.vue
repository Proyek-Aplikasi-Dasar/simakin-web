<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Guru Pembimbing', to: backTo }, { label: 'Tambah Guru' }]"
      title="Tambah Guru"
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

    <form class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" @submit.prevent>
      <FormCard title="Identitas Guru" description="Pastikan data sesuai dokumen kepegawaian.">
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField id="nama" v-model="form.nama" label="Nama Lengkap (beserta gelar)" placeholder="Masukkan nama lengkap" />
          <FormField id="nip" v-model="form.nip" label="NIP" placeholder="Masukkan NIP" />
          <FormField id="email" v-model="form.email" type="email" label="Email" placeholder="Masukkan email" />
          <FormField id="telepon" v-model="form.telepon" label="Nomor Telepon" placeholder="Masukkan nomor telepon" />
          <FormField
            id="jurusan_id"
            v-model="form.jurusan_id"
            label="Jurusan"
            placeholder="Pilih jurusan"
            :options="jurusanOptions"
          />
          <FormField
            id="kuota"
            v-model="form.kuota"
            type="number"
            label="Kuota Bimbingan"
            placeholder="0"
            suffix="siswa"
            hint="Batas maksimal siswa."
          />
          <div class="md:col-span-2">
            <FormField id="alamat" v-model="form.alamat" textarea :rows="5" label="Alamat" placeholder="Masukkan alamat" />
          </div>
        </div>

        <template #footer>
          <p class="mr-auto text-[11px] text-slate-500">Penyimpanan aktif setelah endpoint BE tersedia.</p>
          <router-link :to="backTo" class="px-3 text-sm font-semibold text-blue-600">Batal</router-link>
          <button
            type="submit"
            disabled
            title="Menunggu endpoint BE"
            class="flex h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white opacity-60"
          >
            <AppIcon name="save" class="h-4 w-4" />
            Simpan Data Guru
          </button>
        </template>
      </FormCard>

      <div>
        <FormCard title="Alokasi Siswa" description="Siswa yang dibimbing guru ini.">
          <template #action>
            <span class="cursor-not-allowed text-xs font-semibold text-blue-600 opacity-50" title="Segera hadir">Tambah</span>
          </template>
          <p class="py-6 text-center text-sm text-slate-400">Data alokasi belum tersedia. Menunggu endpoint dari BE.</p>
        </FormCard>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import AppIcon from '../../components/AppIcon.vue'
import { fetchAll } from '../../composables/useMasterResource'

const backTo = '/admin/master-data/guru'

const form = reactive({ nama: '', nip: '', email: '', telepon: '', jurusan_id: '', kuota: '', alamat: '' })

const jurusanList = ref([])
const jurusanOptions = computed(() => jurusanList.value.map((j) => ({ value: j.id, label: j.nama })))

onMounted(async () => {
  try {
    jurusanList.value = await fetchAll('/api/jurusan')
  } catch {
  }
})
</script>