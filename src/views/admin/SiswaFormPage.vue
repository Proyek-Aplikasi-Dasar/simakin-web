<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Siswa PKL', to: backTo }, { label: 'Tambah Siswa' }]"
      title="Tambah Siswa"
      subtitle="Data pokok siswa, orang tua / wali, akademik, dan alokasi PKL."
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
      <!-- Kolom kiri -->
      <div class="flex flex-col gap-6">
        <FormCard title="Data Pribadi" description="Sama dengan data yang dilengkapi siswa di aplikasi.">
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField id="nama" v-model="form.nama" label="Nama Lengkap" placeholder="Masukkan nama lengkap" />
            <FormField id="nis" v-model="form.nis" label="NIS / NISN" placeholder="Masukkan NIS / NISN" />
            <FormField id="ttl" v-model="form.ttl" label="Tempat, Tanggal Lahir" placeholder="Contoh: Kota, 1 Januari 2008" />
            <FormField
              id="jenis_kelamin"
              v-model="form.jenis_kelamin"
              label="Jenis Kelamin"
              placeholder="Pilih jenis kelamin"
              :options="jenisKelamin"
            />
            <FormField id="email" v-model="form.email" type="email" label="Email" placeholder="Masukkan email" />
            <FormField id="hp" v-model="form.hp" label="Nomor HP" placeholder="Masukkan nomor HP" />
            <div class="md:col-span-2">
              <FormField id="alamat" v-model="form.alamat" textarea :rows="5" label="Alamat" placeholder="Masukkan alamat" />
            </div>
          </div>
        </FormCard>

        <FormCard title="Data Orang Tua / Wali" description="Cukup satu orang tua atau wali.">
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField id="wali_nama" v-model="form.wali_nama" label="Nama Orang Tua / Wali" placeholder="Masukkan nama" />
            <FormField id="wali_hp" v-model="form.wali_hp" label="Nomor HP" placeholder="Masukkan nomor HP" />
            <div class="md:col-span-2">
              <FormField
                id="wali_alamat"
                v-model="form.wali_alamat"
                textarea
                :rows="5"
                label="Alamat Orang Tua / Wali (opsional)"
                placeholder="Masukkan alamat"
                hint="Boleh dikosongkan. Siswa dapat melengkapi sendiri dari aplikasi."
              />
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
              Simpan Data Siswa
            </button>
          </template>
        </FormCard>
      </div>

      <!-- Kolom kanan -->
      <div class="flex flex-col gap-6">
        <FormCard title="Alokasi PKL" description="Bisa diisi nanti lewat menu Penempatan.">
          <div class="flex flex-col gap-5">
            <FormField
              id="tempat_pkl"
              v-model="form.tempat_pkl"
              label="Tempat PKL"
              placeholder="Menunggu data dari BE"
              :options="[]"
              disabled
            />
            <FormField
              id="pembimbing"
              v-model="form.pembimbing"
              label="Guru Pembimbing"
              placeholder="Menunggu data dari BE"
              :options="[]"
              disabled
            />
            <FormField id="periode" v-model="form.periode" label="Periode" placeholder="Contoh: 1 Sep – 30 Nov 2026" />
          </div>
        </FormCard>

        <FormCard title="Akun Siswa">
          <div class="-my-3">
            <SwitchRow
              v-model="form.akun_otomatis"
              label="Buat akun otomatis"
              hint="Username dan password awal memakai NIS."
            />
            <SwitchRow v-model="form.wajib_ganti_password" label="Wajib ganti password" hint="Saat login pertama kali." />
          </div>
        </FormCard>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import SwitchRow from '../../components/SwitchRow.vue'
import AppIcon from '../../components/AppIcon.vue'

const backTo = '/admin/master-data/siswa'

const jenisKelamin = [
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' },
]

const form = reactive({
  nama: '',
  nis: '',
  ttl: '',
  jenis_kelamin: '',
  email: '',
  hp: '',
  alamat: '',
  wali_nama: '',
  wali_hp: '',
  wali_alamat: '',
  tempat_pkl: '',
  pembimbing: '',
  periode: '',
  akun_otomatis: true,
  wajib_ganti_password: true,
})
</script>