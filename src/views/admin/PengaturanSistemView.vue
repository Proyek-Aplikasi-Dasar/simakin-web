<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Lainnya' }, { label: 'Pengaturan Sistem' }]"
      title="Pengaturan Sistem"
      subtitle="Atur jam presensi harian dan penilaian bulanan: bulan aktif."
    />

    <div class="flex flex-col gap-6">
      <div
        v-if="dirty"
        role="status"
        class="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-[13px] font-medium text-yellow-700"
      >
        <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
        Ada perubahan yang belum disimpan. Klik Simpan Perubahan sebelum pindah halaman.
      </div>

      <FormCard title="Jam Presensi" description="Presensi cukup satu kali per hari, tanpa presensi masuk dan pulang.">
        <p v-if="loadError" class="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-600">{{ loadError }}</p>
        <PageSkeleton v-if="loading" :blocks="2" />

        <div v-else class="flex flex-col gap-5">
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <TimeSelect
              id="mulai"
              v-model="form.mulai"
              label="Presensi Dibuka"
              :note="catatan('mulai')"
              :error="fieldErrors.mulai"
            />
            <TimeSelect
              id="selesai"
              v-model="form.selesai"
              label="Presensi Ditutup"
              :note="catatan('selesai')"
              :error="fieldErrors.selesai"
            />
          </div>

          <p v-if="jumlahLain > 0" class="rounded-lg bg-blue-50 p-3 text-xs text-slate-600">
            Di BE ada {{ jumlahLain }} jam presensi lain. Halaman ini hanya menampilkan dan mengubah yang pertama.
          </p>

          <SwitchRow
            v-model="aktif"
            label="Jam presensi aktif"
            hint="Jika dinonaktifkan, jam ini tidak dipakai untuk membatasi presensi siswa."
          />
          <p v-if="fieldErrors.is_active" class="-mt-3 text-xs text-red-600">{{ fieldErrors.is_active }}</p>

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

      <PenilaianBulananSettings />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import TimeSelect from '../../components/TimeSelect.vue'
import SwitchRow from '../../components/SwitchRow.vue'
import PenilaianBulananSettings from '../../components/PenilaianBulananSettings.vue'
import AppIcon from '../../components/AppIcon.vue'
import PageSkeleton from '../../components/PageSkeleton.vue'
import { getErrorMessage } from '../../services/api'
import { useMasterResource, fetchAll } from '../../composables/useMasterResource'

const ENDPOINT = '/api/waktu-absen'

const hhmm = (v) => (v ? String(v).slice(0, 5) : '')

const form = reactive({ mulai: '', selesai: '' })
const selfie = ref(true)
const aktif = ref(true)
const current = ref(null)
const jumlahLain = ref(0)
const loading = ref(true)
const loadError = ref('')

const { saving, fieldErrors, save } = useMasterResource(ENDPOINT, { name: 'Jam presensi', reload: false })

const aktifTersimpan = () => (current.value?.is_active == null ? true : !!current.value.is_active)

const dirty = computed(() => {
  if (loading.value) return false
  return (
    form.mulai !== hhmm(current.value?.mulai) ||
    form.selesai !== hhmm(current.value?.selesai) ||
    aktif.value !== aktifTersimpan()
  )
})

function catatan(key) {
  const lama = hhmm(current.value?.[key])
  if (!lama || form[key] === lama) return ''
  return `Diubah dari ${lama} WIB · belum disimpan`
}

function fill() {
  form.mulai = hhmm(current.value?.mulai)
  form.selesai = hhmm(current.value?.selesai)
  aktif.value = aktifTersimpan()
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
    values: {
      mulai: form.mulai,
      selesai: form.selesai,
      keterangan: current.value?.keterangan ?? null,
      is_active: aktif.value,
    },
  })
  if (ok) await load(true)
}

onBeforeRouteLeave(() => {
  if (dirty.value && !window.confirm('Ada perubahan yang belum disimpan. Tetap pindah halaman?')) return false
})

onMounted(load)
</script>
