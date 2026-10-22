<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Siswa PKL', to: '/admin/master-data/siswa' }, { label: 'Export / Import' }]"
      title="Export / Import Data"
      subtitle="Unduh data atau import data massal dari file Excel."
    >
      <button
        type="button"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
        @click="router.back()"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </button>
    </PageHeader>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div class="flex flex-col gap-6">
        <FormCard title="Unduh Template" description="Isi template ini lalu import di bawah.">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="t in templates"
              :key="t.label"
              class="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-100 p-4"
            >
              <span :class="['flex h-10 w-10 items-center justify-center rounded-lg', tones[t.tone]]">
                <AppIcon :name="t.icon" class="h-5 w-5" />
              </span>
              <div>
                <p class="text-xs font-semibold leading-4 text-slate-900">Template {{ t.label }}</p>
                <p class="text-[11px] leading-[14px] text-slate-500">.xlsx</p>
              </div>
              <button
                type="button"
                disabled
                title="Menunggu format template dari BE"
                class="flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold opacity-60"
              >
                <AppIcon name="download" class="h-4 w-4" />
                Unduh
              </button>
            </div>
          </div>
        </FormCard>

        <FormCard
          title="Import Data"
          description="Pilih jenis data, lalu pilih file .xlsx yang sudah diisi sesuai template."
        >
          <div class="flex flex-col gap-5">
            <FormField
              id="jenis"
              v-model="jenis"
              label="Jenis Data"
              placeholder="Pilih jenis data yang akan diimport"
              :options="importOptions"
            />
            <FileDropzone :key="dropKey" @change="file = $event" />

            <div v-if="result" class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
              <p class="font-semibold text-slate-900">{{ result.message }}</p>
              <p class="mt-1 text-slate-600">
                Berhasil: {{ result.success }} data · Gagal: {{ result.failed }} data
              </p>
              <ul v-if="result.errors?.length" class="mt-3 max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-red-600">
                <li v-for="(e, i) in result.errors" :key="i">Baris {{ e.row }}: {{ e.error }}</li>
              </ul>
            </div>
          </div>

          <template #footer>
            <p class="mr-auto text-[11px] text-slate-500">Format file: .xlsx, baris pertama berisi nama kolom.</p>
            <button
              type="button"
              :disabled="!jenis || !file || importing"
              class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              @click="startImport"
            >
              <AppIcon name="file" class="h-4 w-4" />
              {{ importing ? 'Mengimport...' : 'Mulai Import' }}
            </button>
          </template>
        </FormCard>
      </div>

      <FormCard title="Export Data" description="Semua data dan laporan yang bisa diexport, dalam format Excel.">
        <div class="flex flex-col gap-3">
          <p class="text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Data</p>
          <div
            v-for="e in exportData"
            :key="e.label"
            class="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
          >
            <span :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tones[e.tone]]">
              <AppIcon :name="e.icon" class="h-5 w-5" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold leading-4 text-slate-900">{{ e.label }}</p>
              <p v-if="e.hint" class="text-[11px] leading-[14px] text-slate-500">{{ e.hint }}</p>
            </div>
            <button
              type="button"
              disabled
              :aria-label="`Unduh ${e.label}`"
              title="Menunggu endpoint BE"
              class="flex h-10 w-10 shrink-0 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 opacity-60"
            >
              <AppIcon name="download" class="h-5 w-5" />
            </button>
          </div>

          <p class="mt-2 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Laporan PKL</p>
          <div
            v-for="e in exportReports"
            :key="e.label"
            class="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
          >
            <span :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tones[e.tone]]">
              <AppIcon :name="e.icon" class="h-5 w-5" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold leading-4 text-slate-900">{{ e.label }}</p>
              <p v-if="e.hint" class="text-[11px] leading-[14px] text-slate-500">{{ e.hint }}</p>
            </div>
            <button
              type="button"
              disabled
              :aria-label="`Unduh ${e.label}`"
              title="Menunggu endpoint BE"
              class="flex h-10 w-10 shrink-0 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 opacity-60"
            >
              <AppIcon name="download" class="h-5 w-5" />
            </button>
          </div>
        </div>
      </FormCard>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import FileDropzone from '../../components/FileDropzone.vue'
import AppIcon from '../../components/AppIcon.vue'
import api, { getErrorMessage } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const router = useRouter()

const toast = useToastStore()

const jenis = ref('')
const file = ref(null)
const importing = ref(false)
const result = ref(null)
const dropKey = ref(0)

const importEndpoints = {
  Siswa: '/api/siswa/bulk-upload',
  Guru: '/api/guru/bulk-upload',
  Perusahaan: '/api/perusahaan/bulk-upload',
  Kompetensi: '/api/kompetensi/bulk-upload',
}
const importOptions = computed(() =>
  Object.keys(importEndpoints).map((label) => ({ value: label, label }))
)

async function startImport() {
  if (!jenis.value || !file.value || importing.value) return
  importing.value = true
  result.value = null

  const body = new FormData()
  body.append('file', file.value)

  try {
    const { data } = await api.post(importEndpoints[jenis.value], body)
    result.value = data
    toast.show(data.message || 'Import selesai.', data.failed > 0 ? 'error' : 'success')
    file.value = null
    dropKey.value++
  } catch (err) {
    const status = err.response?.status
    if (status === 404) {
      toast.show('Endpoint import belum tersedia di BE.', 'error')
    } else if (status && ![401, 403, 419, 429].includes(status) && status < 500) {
      toast.show(getErrorMessage(err, 'Import gagal.'), 'error')
    }
  } finally {
    importing.value = false
  }
}

const tones = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-yellow-50 text-yellow-700',
}

const templates = [
  { label: 'Siswa', icon: 'users', tone: 'blue' },
  { label: 'Guru', icon: 'user-check', tone: 'blue' },
  { label: 'Perusahaan', icon: 'building', tone: 'amber' },
  { label: 'Jurusan', icon: 'cap', tone: 'blue' },
  { label: 'Kompetensi', icon: 'clipboard-list', tone: 'blue' },
  { label: 'Gelombang PKL', icon: 'calendar-check', tone: 'green' },
]

const exportData = [
  { label: 'Data Siswa PKL', icon: 'users', tone: 'blue' },
  { label: 'Data Guru Pembimbing', icon: 'user-check', tone: 'blue' },
  { label: 'Data Perusahaan Mitra', icon: 'building', tone: 'amber' },
  { label: 'Jurusan', icon: 'cap', tone: 'blue' },
  { label: 'Kompetensi (KI/KD)', icon: 'clipboard-list', tone: 'blue' },
  { label: 'Gelombang PKL', icon: 'calendar-check', tone: 'green' },
  { label: 'Soft Skill', icon: 'award', tone: 'amber' },
  { label: 'Lokasi & Penempatan', icon: 'pin', tone: 'blue', hint: 'Penempatan siswa per perusahaan' },
]

const exportReports = [
  { label: 'Pengajuan PKL', icon: 'clipboard-list', tone: 'blue', hint: 'Semua status pengajuan' },
  { label: 'Presensi Siswa', icon: 'clipboard-check', tone: 'blue' },
  { label: 'Jurnal Harian', icon: 'file', tone: 'blue' },
  { label: 'Rekap Presensi & Jurnal', icon: 'chart', tone: 'blue' },
]
</script>