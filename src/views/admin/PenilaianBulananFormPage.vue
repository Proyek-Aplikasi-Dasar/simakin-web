<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Penilaian', to: '/admin/penilaian' }, { label: isEdit ? 'Edit Nilai' : 'Isi Nilai' }]"
      :title="isEdit ? 'Edit Penilaian Bulanan' : 'Isi Penilaian Bulanan'"
      :subtitle="isEdit ? `Ubah nilai bulan ke-${bulan}${periodeLabel ? ` (${periodeLabel})` : ''}.` : `Isi nilai bulan ke-${bulan}${periodeLabel ? ` (${periodeLabel})` : ''} atas nama pembimbing industri.`"
    >
      <router-link
        :to="backTo"
        class="flex h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-5 w-5" />
        Kembali
      </router-link>
    </PageHeader>

    <div v-if="error" class="flex flex-col items-center gap-3 py-16 text-center">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">Coba lagi</button>
    </div>

    <div v-else class="flex flex-col gap-6">
      <PenilaianSiswaCard
        :siswa="ringkas?.siswa"
        :info="ringkas?.info"
        :loading="loading"
        :status-label="`Bulan ke-${bulan}`"
      />

      <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_360px]">
        <form novalidate @submit.prevent="submit">
          <FormCard
            :title="`Penilaian Bulan ke-${bulan}${periodeLabel ? ` · ${periodeLabel}` : ''}`"
            description="Nilai 0 – 100. Disimpan sebagai penilaian dari industri."
          >
            <p v-if="loading" class="py-10 text-center text-sm text-slate-400">Memuat form penilaian…</p>

            <div v-else class="flex flex-col gap-5">
              <h3 class="text-base font-semibold leading-6 text-slate-900">Nilai Sikap (Soft Skill)</h3>
              <p v-if="!sikapList.length" class="text-xs text-slate-500">Belum ada aspek sikap di Data Master.</p>
              <div v-else class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
                <FormField
                  v-for="s in sikapList"
                  :id="`sikap_${s.id}`"
                  :key="`sikap_${s.id}`"
                  v-model="nilai[`sikap_${s.id}`]"
                  :label="s.nama"
                  required
                  inputmode="decimal"
                  placeholder="0 – 100"
                  hint="0 – 100"
                  :error="errors[`sikap_${s.id}`]"
                  @blur="cek(`sikap_${s.id}`)"
                />
              </div>

              <h3 class="mt-1 text-base font-semibold leading-6 text-slate-900">Nilai Kompetensi</h3>
              <p v-if="!kompetensiList.length" class="text-xs text-slate-500">Belum ada kompetensi untuk program studi siswa ini.</p>
              <div v-else class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
                <FormField
                  v-for="k in kompetensiList"
                  :id="`kompetensi_${k.id}`"
                  :key="`kompetensi_${k.id}`"
                  v-model="nilai[`kompetensi_${k.id}`]"
                  :label="[k.kode, k.nama].filter(Boolean).join(' ')"
                  required
                  inputmode="decimal"
                  placeholder="0 – 100"
                  hint="0 – 100"
                  :error="errors[`kompetensi_${k.id}`]"
                  @blur="cek(`kompetensi_${k.id}`)"
                />
              </div>
            </div>

            <template #footer>
              <router-link :to="backTo" class="flex h-[42px] items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50">
                Batal
              </router-link>
              <button
                type="submit"
                :disabled="saving || loading"
                class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <AppIcon name="save" class="h-5 w-5" />
                {{ saving ? 'Menyimpan…' : 'Simpan Penilaian' }}
              </button>
            </template>
          </FormCard>
        </form>

        <aside class="flex flex-col gap-6">
          <FormCard title="Rekap Nilai Siswa" description="Bahan pertimbangan nilai akhir.">
            <div class="flex flex-col gap-4">
              <InfoItem icon="chart" label="Nilai Bulan Lalu" :value="rekap.nilaiBulanLalu != null ? fmtNilai(rekap.nilaiBulanLalu) : ''" />
              <InfoItem icon="calendar-check" label="Kehadiran" :value="rekap.kehadiran != null ? `${rekap.kehadiran}%` : ''" />
              <InfoItem icon="file" label="Jurnal Terkirim" :value="rekap.jurnalTerkirim != null ? `${rekap.jurnalTerkirim} jurnal` : ''" />
            </div>
          </FormCard>

          <InfoAlert
            icon="eye"
            title="Diisi atas nama industri"
            text="Admin mengisi jika industri belum mengisi lewat token. Nilai langsung tampil di siswa dan guru."
          />
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getErrorMessage } from '../../services/api'
import { fetchAll } from '../../composables/useMasterResource'
import { useToastStore } from '../../stores/toast'
import { fetchRingkasSiswa, nilaiRules, fmtNilai, namaBulan } from '../../utils/penilaian'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import InfoItem from '../../components/InfoItem.vue'
import InfoAlert from '../../components/InfoAlert.vue'
import PenilaianSiswaCard from '../../components/PenilaianSiswaCard.vue'
import AppIcon from '../../components/AppIcon.vue'

const props = defineProps({
  siswaId: { type: [String, Number], required: true },
  bulan: { type: [String, Number], required: true },
  periode: { type: String, default: '' }, // contoh '2026-10' (dari query)
  mode: { type: String, default: 'isi' }, // 'isi' | 'edit'
})

const toast = useToastStore()

const isEdit = computed(() => props.mode === 'edit')
const backTo = computed(() => `/admin/penilaian/${props.siswaId}`)
const periodeLabel = computed(() => namaBulan(props.periode))

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const ringkas = ref(null)
const sikapList = ref([]) // [{ id, nama }]
const kompetensiList = ref([]) // [{ id, kode, nama }]

const nilai = reactive({}) // { sikap_1: '92', kompetensi_3: '90', ... }
const errors = reactive({})

const rekap = computed(() => ringkas.value?.rekap ?? {})

const norm = (v) => String(v ?? '').trim().replace(',', '.')

function cek(key) {
  for (const rule of nilaiRules()) {
    const msg = rule(norm(nilai[key]))
    if (msg) {
      errors[key] = msg
      return false
    }
  }
  delete errors[key]
  return true
}

function validateAll() {
  const keys = [...sikapList.value.map((s) => `sikap_${s.id}`), ...kompetensiList.value.map((k) => `kompetensi_${k.id}`)]
  const ok = keys.map(cek).every(Boolean)
  if (!ok) document.getElementById(keys.find((k) => errors[k]))?.focus()
  return ok
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [r, sikap, kompetensi] = await Promise.all([
      fetchRingkasSiswa(props.siswaId),
      fetchAll('/api/sikap'),
      fetchAll('/api/kompetensi'),
    ])
    ringkas.value = r
    sikapList.value = sikap
    kompetensiList.value = kompetensi.filter((k) => !r.siswa.jurusanId || k.jurusan_id === r.siswa.jurusanId)

    ;[...sikapList.value.map((s) => `sikap_${s.id}`), ...kompetensiList.value.map((k) => `kompetensi_${k.id}`)].forEach((key) => {
      if (!(key in nilai)) nilai[key] = ''
    })
    if (isEdit.value) await loadTersimpan()
  } catch (err) {
    error.value = getErrorMessage(err, 'Gagal memuat form penilaian.')
  } finally {
    loading.value = false
  }
}

async function loadTersimpan() {

}

function buildPayload() {
  const pick = (prefix) =>
    Object.entries(nilai)
      .filter(([k]) => k.startsWith(`${prefix}_`))
      .map(([k, v]) => ({ id: Number(k.split('_')[1]), nilai: Number(norm(v)) }))
  return { siswa_id: Number(props.siswaId), bulan_ke: Number(props.bulan), sikap: pick('sikap'), kompetensi: pick('kompetensi') }
}

async function submit() {
  if (saving.value || !validateAll()) return
  saving.value = true
  try {
    const payload = buildPayload()

    void payload
    toast.warning('Penyimpanan belum tersambung: endpoint penilaian belum tersedia di BE.')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Gagal menyimpan penilaian.'))
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
