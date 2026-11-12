<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Jurnal Harian', to: '/admin/jurnal-harian' }, { label: isEdit ? 'Edit Jurnal' : 'Tambah Jurnal' }]"
      :title="isEdit ? 'Edit Jurnal' : 'Tambah Jurnal'"
      :subtitle="isEdit ? 'Perbarui jurnal siswa yang sudah tercatat.' : 'Catat jurnal manual untuk siswa yang belum mengisi.'"
    >
      <router-link
        to="/admin/jurnal-harian"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </router-link>
    </PageHeader>

    <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_380px]">
      <form novalidate @submit.prevent="submit">
        <FormCard title="Form Jurnal" description="Satu jurnal per hari, sama seperti form di aplikasi siswa.">
          <div class="flex flex-col gap-5">
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Siswa</label>
                <input v-if="isEdit" :value="siswaLabel" disabled :class="[inputCls, 'bg-slate-50']" />
                <select v-else v-model="form.siswa_id" :class="inputCls">
                  <option value="">Pilih siswa</option>
                  <option v-for="s in siswaOptions" :key="s.id" :value="String(s.id)">{{ s.nama }} · {{ s.nis }}</option>
                </select>
                <p v-if="errors.siswa_id" class="mt-1 text-xs text-red-600">{{ errors.siswa_id }}</p>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Tanggal</label>
                <input v-model="form.tanggal" type="date" :disabled="isEdit" :class="[inputCls, isEdit ? 'bg-slate-50' : '']" />
                <p v-if="errors.tanggal" class="mt-1 text-xs text-red-600">{{ errors.tanggal }}</p>
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Kompetensi</label>
              <div class="relative">
                <select v-model="form.kompetensi_id" :class="[inputCls, 'appearance-none pr-10']">
                  <option value="">Pilih kompetensi</option>
                  <option v-for="k in kompetensiOptions" :key="k.id" :value="String(k.id)">{{ k.nama }}</option>
                </select>
                <AppIcon name="chevron-down" class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              <p v-if="errors.kompetensi_id" class="mt-1 text-xs text-red-600">{{ errors.kompetensi_id }}</p>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Deskripsi (opsional)</label>
              <textarea
                v-model="form.deskripsi"
                rows="5"
                placeholder="Masukkan deskripsi"
                :class="[inputCls, 'h-auto py-3']"
              ></textarea>
              <p v-if="errors.deskripsi" class="mt-1 text-xs text-red-600">{{ errors.deskripsi }}</p>
            </div>
          </div>

          <template #footer>
            <router-link to="/admin/jurnal-harian" class="px-3 text-sm font-semibold text-blue-600 hover:underline">Batal</router-link>
            <button
              type="submit"
              :disabled="saving"
              class="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <AppIcon name="save" class="h-5 w-5" />
              {{ saving ? 'Menyimpan…' : 'Simpan Jurnal' }}
            </button>
          </template>
        </FormCard>
      </form>

      <aside class="flex flex-col gap-4">
        <InfoAlert
          icon="alert"
          :title="isEdit ? 'Koreksi jurnal' : 'Jurnal manual'"
          :text="isEdit ? 'Perubahan tercatat di riwayat dan terlihat oleh guru pembimbing.' : 'Dicatat atas nama siswa dan langsung terlihat di riwayat.'"
        />

        <FormCard v-if="isEdit" title="Data Sebelumnya">
          <div class="flex flex-col gap-4">
            <InfoItem icon="circle-x" label="Status" :value="lama?.status || '—'" />
            <InfoItem icon="arrow-right" label="Waktu Kirim" :value="lama?.waktuKirim || '—'" />
            <InfoItem icon="user" label="Diubah Oleh" :value="lama?.diubahOleh || '—'" />
          </div>
        </FormCard>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { toIso } from '../../utils/siswa'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import InfoItem from '../../components/InfoItem.vue'
import InfoAlert from '../../components/InfoAlert.vue'
import AppIcon from '../../components/AppIcon.vue'

const props = defineProps({ id: { type: [String, Number], default: null } })
const route = useRoute()

const inputCls =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-200'

const isEdit = computed(() => !!props.id)
const saving = ref(false)
const errors = reactive({})

const siswaOptions = ref([]) // [{ id, nama, nis }]
const kompetensiOptions = ref([]) // [{ id, nama }]
const lama = ref(null) // { status, waktuKirim, diubahOleh, siswaLabel }
const siswaLabel = computed(() => lama.value?.siswaLabel ?? '')

const form = reactive({
  siswa_id: String(route.query.siswa_id ?? ''),
  tanggal: String(route.query.tanggal ?? toIso(new Date())),
  kompetensi_id: '',
  deskripsi: '',
})

async function submit() {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!isEdit.value && !form.siswa_id) errors.siswa_id = 'Siswa wajib dipilih.'
  if (!form.tanggal) errors.tanggal = 'Tanggal wajib diisi.'
  if (!form.kompetensi_id) errors.kompetensi_id = 'Kompetensi wajib dipilih.'
  if (Object.keys(errors).length) return

  saving.value = true
  try {
  } finally {
    saving.value = false
  }
}
</script>