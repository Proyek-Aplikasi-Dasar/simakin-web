<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Lainnya' }, { label: 'Pengaturan Sistem' }]"
      title="Pengaturan Sistem"
      subtitle="Atur jam presensi harian dan penilaian bulanan: bulan aktif, tanggal pengisian, dan token."
    />

    <div class="flex max-w-3xl flex-col gap-6">
      <FormCard title="Jam Presensi" description="Presensi cukup satu kali per hari, tanpa presensi masuk dan pulang.">
        <p v-if="loadError" class="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-600">{{ loadError }}</p>
        <p v-if="loading" class="text-sm text-slate-500">Memuat data...</p>

        <div v-else class="flex flex-col gap-5">
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              id="mulai"
              v-model="form.mulai"
              type="time"
              label="Presensi Dibuka"
              hint="Waktu WIB."
              :error="fieldErrors.mulai"
            />
            <FormField
              id="selesai"
              v-model="form.selesai"
              type="time"
              label="Presensi Ditutup"
              hint="Waktu WIB. Harus setelah jam dibuka."
              :error="fieldErrors.selesai"
            />
          </div>

          <p v-if="jumlahLain > 0" class="rounded-lg bg-blue-50 p-3 text-xs text-slate-600">
            Di BE ada {{ jumlahLain }} jam presensi lain. Halaman ini hanya menampilkan dan mengubah yang pertama.
          </p>

          <div class="pointer-events-none opacity-60" title="Menunggu kolom dari BE">
            <SwitchRow
              v-model="selfie"
              label="Wajib foto selfie saat Hadir"
              hint="Foto disimpan sebagai bukti kehadiran dan divalidasi otomatis."
            />
          </div>
          <p class="-mt-3 text-[11px] text-slate-400">Pengaturan selfie menunggu kolom dari BE.</p>
        </div>

        <template #footer>
          <button
            type="button"
            class="px-3 text-sm font-semibold text-blue-600 disabled:opacity-50"
            :disabled="saving || loading"
            @click="reset"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="saving || loading || !!loadError"
            class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            @click="submit"
          >
            <AppIcon name="save" class="h-4 w-4" />
            {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </template>
      </FormCard>

      <FormCard
        title="Penilaian Bulanan"
        description="Pilih bulan saat pembimbing industri boleh mengisi penilaian lewat HP siswa."
      >
        <p class="py-6 text-center text-sm text-slate-400">
          Pengaturan penilaian bulanan belum tersedia. Menunggu endpoint dari BE.
        </p>
      </FormCard>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import SwitchRow from '../../components/SwitchRow.vue'
import AppIcon from '../../components/AppIcon.vue'
import { getErrorMessage } from '../../services/api'
import { useMasterResource, fetchAll } from '../../composables/useMasterResource'

const ENDPOINT = '/api/waktu-absen'

const form = reactive({ mulai: '', selesai: '' })
const selfie = ref(true)
const current = ref(null) 
const jumlahLain = ref(0)
const loading = ref(true)
const loadError = ref('')

const { saving, fieldErrors, save } = useMasterResource(ENDPOINT, { name: 'Jam presensi', reload: false })

function fill() {
  form.mulai = current.value?.mulai ?? ''
  form.selesai = current.value?.selesai ?? ''
}

async function load(silent = false) {
  if (!silent) loading.value = true
  loadError.value = ''
  try {
    const rows = await fetchAll(ENDPOINT)
    current.value = rows[0] ?? null
    jumlahLain.value = Math.max(0, rows.length - 1)
    fill()
  } catch (err) {
    loadError.value = getErrorMessage(err, 'Gagal memuat jam presensi.')
  } finally {
    loading.value = false
  }
}

function reset() {
  fieldErrors.value = {}
  fill()
}

async function submit() {
  const ok = await save({
    mode: current.value ? 'edit' : 'create',
    row: current.value,
    values: { mulai: form.mulai, selesai: form.selesai, keterangan: current.value?.keterangan ?? null },
  })
  if (ok) await load(true)
}

onMounted(load)
</script>