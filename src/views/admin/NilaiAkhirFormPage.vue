<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Penilaian', to: '/admin/penilaian' }, { label: isEdit ? 'Edit Nilai' : 'Input Nilai' }]"
      :title="isEdit ? 'Edit Nilai Akhir' : 'Input Nilai Akhir'"
      :subtitle="isEdit ? 'Ubah nilai akhir PKL dan catatan untuk siswa.' : 'Masukkan nilai akhir PKL siswa. Biasanya diisi guru pembimbing.'"
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
        :status-label="isEdit ? 'Sudah Dinilai' : 'Belum Dinilai'"
        :status-tone="isEdit ? 'success' : 'neutral'"
      />

      <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_360px]">
        <form novalidate @submit.prevent="submit">
          <FormCard title="Nilai Akhir PKL" description="Isi nilai dan catatan. Siswa bisa melihatnya di aplikasi setelah disimpan.">
            <div class="flex flex-col gap-5">
              <FormField
                id="nilai_akhir"
                v-model="form.nilai_akhir"
                label="Nilai Akhir"
                required
                inputmode="decimal"
                placeholder="0 – 100"
                hint="Rentang nilai 0 – 100."
                :disabled="loading"
                :error="errorOf('nilai_akhir')"
                @blur="touch('nilai_akhir')"
              />

              <FormField
                id="catatan"
                v-model="form.catatan"
                label="Catatan untuk Siswa"
                textarea
                :rows="5"
                :maxlength="1000"
                placeholder="Masukkan catatan untuk siswa"
                hint="Opsional. Tampil bersama nilai di aplikasi siswa."
                :disabled="loading"
                :error="errorOf('catatan')"
                @blur="touch('catatan')"
              />
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
                {{ saving ? 'Menyimpan…' : 'Simpan Nilai' }}
              </button>
            </template>
          </FormCard>
        </form>

        <aside class="flex flex-col gap-6">
          <FormCard title="Rekap Nilai Siswa" description="Bahan pertimbangan nilai akhir.">
            <div class="flex flex-col gap-4">
              <InfoItem icon="chart" label="Rata-rata Nilai Bulanan" :value="rekap.rataRataBulanan != null ? fmtNilai(rekap.rataRataBulanan) : ''" />
              <InfoItem icon="calendar-check" label="Kehadiran" :value="rekap.kehadiran != null ? `${rekap.kehadiran}%` : ''" />
              <InfoItem icon="file" label="Jurnal Terkirim" :value="rekap.jurnalTerkirim != null ? `${rekap.jurnalTerkirim} jurnal` : ''" />
            </div>
          </FormCard>

          <InfoAlert
            icon="eye"
            title="Nilai terlihat oleh siswa"
            text="Setelah disimpan, nilai akhir dan catatan langsung tampil di aplikasi siswa."
          />
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getErrorMessage } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import { useFormValidation } from '../../composables/useFormValidation'
import { maxLength } from '../../utils/validators'
import { fetchRingkasSiswa, nilaiRules, fmtNilai } from '../../utils/penilaian'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import InfoItem from '../../components/InfoItem.vue'
import InfoAlert from '../../components/InfoAlert.vue'
import PenilaianSiswaCard from '../../components/PenilaianSiswaCard.vue'
import AppIcon from '../../components/AppIcon.vue'

const props = defineProps({
  siswaId: { type: [String, Number], required: true },
  mode: { type: String, default: 'isi' }, // 'isi' | 'edit'
})

const toast = useToastStore()

const isEdit = computed(() => props.mode === 'edit')
const backTo = computed(() => `/admin/penilaian/${props.siswaId}`)

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const ringkas = ref(null)
const fieldErrors = ref({}) 

const rekap = computed(() => ringkas.value?.rekap ?? {})

const form = reactive({ nilai_akhir: '', catatan: '' })

const dariKoma = (rule) => (v) => rule(String(v ?? '').trim().replace(',', '.'))

const { errorOf, validate, touch } = useFormValidation(
  form,
  {
    nilai_akhir: nilaiRules().map(dariKoma),
    catatan: [maxLength(1000, 'Catatan maksimal 1000 karakter.')],
  },
  { external: () => fieldErrors.value }
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    ringkas.value = await fetchRingkasSiswa(props.siswaId)
    if (isEdit.value) await loadTersimpan()
  } catch (err) {
    error.value = getErrorMessage(err, 'Gagal memuat data siswa.')
  } finally {
    loading.value = false
  }
}

async function loadTersimpan() {

}

async function submit() {
  if (saving.value || !validate()) return
  saving.value = true
  fieldErrors.value = {}
  try {
    const payload = {
      siswa_id: Number(props.siswaId),
      nilai: Number(String(form.nilai_akhir).trim().replace(',', '.')),
      catatan: form.catatan.trim() || null,
    }

    void payload
    toast.warning('Penyimpanan belum tersambung: endpoint nilai akhir belum tersedia di BE.')
  } catch (err) {
    if (err.response?.status === 422) {
      const errs = err.response.data?.errors ?? {}
      fieldErrors.value = Object.fromEntries(Object.entries(errs).map(([f, m]) => [f, m[0]]))
    } else {
      toast.error(getErrorMessage(err, 'Gagal menyimpan nilai akhir.'))
    }
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
