<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Lokasi & Penempatan', to: '/admin/lokasi-penempatan' }, { label: pageTitle }]"
      :title="pageTitle"
      subtitle="Tempatkan siswa di perusahaan, tentukan guru pembimbing dan gelombangnya."
    >
      <router-link
        :to="backTo"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </router-link>
    </PageHeader>

    <p v-if="loadingData" class="py-16 text-center text-sm text-slate-400">Memuat data…</p>
    <div v-else-if="loadError" class="flex flex-col items-center gap-3 py-16 text-center">
      <p class="text-sm text-red-600">{{ loadError }}</p>
      <router-link to="/admin/lokasi-penempatan" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50">
        Kembali ke daftar
      </router-link>
    </div>

    <form v-else class="max-w-3xl" novalidate @submit.prevent="submit">
      <FormCard title="Data Penempatan" description="Satu siswa hanya boleh memiliki satu penempatan aktif.">
        <div class="flex flex-col gap-5">
          <div>
            <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Siswa</label>

            <div
              v-if="siswa"
              class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
            >
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold text-slate-900">{{ siswa.nama }}</p>
                <p class="text-[11px] text-slate-500">NIS {{ siswa.nis }}<template v-if="siswa.kelas"> · {{ siswa.kelas }}</template></p>
              </div>
              <button v-if="!isEdit" type="button" class="text-xs font-semibold text-blue-600 hover:underline" @click="siswa = null">
                Ganti
              </button>
            </div>

            <div v-else class="relative">
              <label
                :class="[
                  'flex h-10 items-center gap-2 rounded-xl border bg-white px-3 focus-within:ring-2 focus-within:ring-blue-100',
                  local.siswa ? 'border-red-300' : 'border-slate-200 focus-within:border-blue-600',
                ]"
              >
                <AppIcon name="search" class="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  v-model="q"
                  type="text"
                  placeholder="Ketik nama atau NIS siswa (min. 2 huruf)…"
                  class="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400"
                />
              </label>

              <ul
                v-if="q.trim().length >= 2"
                class="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
              >
                <li v-if="searching" class="px-3 py-2 text-xs text-slate-400">Mencari…</li>
                <li v-else-if="!results.length" class="px-3 py-2 text-xs text-slate-400">Siswa tidak ditemukan.</li>
                <li v-for="s in results" :key="s.id">
                  <button type="button" class="block w-full px-3 py-2 text-left hover:bg-slate-50" @click="pick(s)">
                    <span class="block text-xs font-semibold text-slate-900">{{ s.user?.name ?? '—' }}</span>
                    <span class="block text-[11px] text-slate-500">NIS {{ s.nis }}<template v-if="s.kelas"> · {{ s.kelas }}</template></span>
                  </button>
                </li>
              </ul>
            </div>

            <p v-if="local.siswa || fieldErrors.siswa_id" class="mt-1 text-xs text-red-600">
              {{ local.siswa || fieldErrors.siswa_id }}
            </p>
            <p v-else-if="isEdit" class="mt-1 text-[11px] text-slate-500">
              Siswa tidak bisa diganti. Hapus penempatan ini lalu buat ulang jika salah orang.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              id="perusahaan"
              v-model="form.perusahaan_id"
              label="Perusahaan"
              placeholder="Pilih perusahaan"
              :options="options.perusahaan"
              :hint="perusahaanHint"
              :error="local.perusahaan || fieldErrors.perusahaan_id || ''"
            />
            <FormField
              id="gelombang"
              v-model="form.gelombang_id"
              label="Gelombang PKL"
              placeholder="Pilih gelombang"
              :options="options.gelombang"
              :error="local.gelombang || fieldErrors.gelombang_id || ''"
            />
          </div>

          <FormField
            id="guru"
            v-model="form.guru_id"
            label="Guru Pembimbing"
            :options="options.guru"
            hint="Boleh dikosongkan dan diisi nanti."
            :error="fieldErrors.guru_id || ''"
          />

          <FormField
            id="catatan"
            v-model="form.catatan"
            label="Catatan"
            textarea
            :rows="3"
            placeholder="Catatan tambahan (opsional)"
            :error="fieldErrors.catatan || ''"
          />
        </div>

        <template #footer>
          <router-link :to="backTo" class="px-3 text-sm font-semibold text-blue-600">Batal</router-link>
          <button
            type="submit"
            :disabled="saving"
            class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <AppIcon name="save" class="h-4 w-4" />
            {{ saving ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Simpan Penempatan' }}
          </button>
        </template>
      </FormCard>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { getErrorMessage } from '../../services/api'
import { fetchAllPages } from '../../utils/siswa'
import { useToastStore } from '../../stores/toast'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import AppIcon from '../../components/AppIcon.vue'

const props = defineProps({ id: { type: String, default: null } })

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const isEdit = !!props.id
const pageTitle = isEdit ? 'Edit Penempatan' : 'Tambah Penempatan'
const preselect = route.query.perusahaan_id ? String(route.query.perusahaan_id) : ''
const backTo = ref(preselect ? `/admin/lokasi-penempatan/${preselect}` : '/admin/lokasi-penempatan')

const form = reactive({ perusahaan_id: preselect, guru_id: 'none', gelombang_id: '', catatan: '' })
const siswa = ref(null) 
const options = reactive({ perusahaan: [], guru: [], gelombang: [] })

const loadingData = ref(true)
const loadError = ref('')
const saving = ref(false)
const perusahaanHint = ref(isEdit ? '' : 'Hanya perusahaan yang kuotanya masih tersedia.')

const local = reactive({})
const fieldErrors = reactive({})

const q = ref('')
const results = ref([])
const searching = ref(false)
let timer = null
let seq = 0

watch(q, (val) => {
  clearTimeout(timer)
  const term = val.trim()
  if (term.length < 2) {
    results.value = []
    return
  }
  timer = setTimeout(async () => {
    const mine = ++seq
    searching.value = true
    try {
      const { data } = await api.get('/api/siswa', { params: { search: term } })
      if (mine === seq) results.value = data.data ?? []
    } catch {
      if (mine === seq) results.value = []
    } finally {
      if (mine === seq) searching.value = false
    }
  }, 350)
})

function pick(s) {
  siswa.value = { id: s.id, nama: s.user?.name ?? '—', nis: s.nis, kelas: s.kelas }
  q.value = ''
  results.value = []
  delete local.siswa
  delete fieldErrors.siswa_id
}

async function loadOptions() {
  const [p, g, gel] = await Promise.all([
    fetchAllPages('/api/perusahaan', isEdit ? {} : { kuota_tersedia: 1 }),
    fetchAllPages('/api/guru'),
    api.get('/api/gelombang'),
  ])
  options.perusahaan = p.map((x) => ({ value: String(x.id), label: x.nama }))
  options.guru = [
    { value: 'none', label: 'Belum ditentukan' },
    ...g.map((x) => ({ value: String(x.id), label: `${x.user?.name ?? '—'} (${x.nip})` })),
  ]
  options.gelombang = (gel.data.data ?? []).map((x) => ({ value: String(x.id), label: `${x.nama} — ${x.tahun_ajaran}` }))

  if (!isEdit && form.perusahaan_id && !options.perusahaan.some((o) => o.value === form.perusahaan_id)) {
    form.perusahaan_id = ''
    perusahaanHint.value = 'Perusahaan yang dipilih sebelumnya sudah penuh kuotanya.'
  }
}

async function loadPenempatan() {
  const { data } = await api.get(`/api/lokasi-pkl/${props.id}`)
  const l = data.data
  siswa.value = { id: l.siswa?.id, nama: l.siswa?.nama ?? '—', nis: l.siswa?.nis ?? '—', kelas: '' }
  form.perusahaan_id = l.perusahaan ? String(l.perusahaan.id) : ''
  form.guru_id = l.guru ? String(l.guru.id) : 'none'
  form.gelombang_id = l.gelombang ? String(l.gelombang.id) : ''
  form.catatan = l.catatan ?? ''
  if (l.perusahaan) backTo.value = `/admin/lokasi-penempatan/${l.perusahaan.id}`
}

onMounted(async () => {
  try {
    await Promise.all([loadOptions(), isEdit ? loadPenempatan() : Promise.resolve()])
  } catch (err) {
    loadError.value =
      err.response?.status === 404 ? 'Penempatan tidak ditemukan.' : getErrorMessage(err, 'Gagal memuat data.')
  } finally {
    loadingData.value = false
  }
})

onBeforeUnmount(() => clearTimeout(timer))

function validate() {
  Object.keys(local).forEach((k) => delete local[k])
  if (!isEdit && !siswa.value) local.siswa = 'Pilih siswa terlebih dahulu.'
  if (!form.perusahaan_id) local.perusahaan = 'Pilih perusahaan.'
  if (!form.gelombang_id) local.gelombang = 'Pilih gelombang.'
  return Object.keys(local).length === 0
}

async function submit() {
  if (saving.value || !validate()) return
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  saving.value = true

  const payload = {
    perusahaan_id: Number(form.perusahaan_id),
    guru_id: form.guru_id === 'none' ? null : Number(form.guru_id),
    gelombang_id: Number(form.gelombang_id),
    catatan: form.catatan.trim() || null,
  }

  try {
    const res = isEdit
      ? await api.put(`/api/lokasi-pkl/${props.id}`, payload)
      : await api.post('/api/lokasi-pkl', { ...payload, siswa_id: siswa.value.id })
    toast.show(res.data.message || 'Penempatan disimpan.')
    router.push(backTo.value)
  } catch (err) {
    const status = err.response?.status
    const body = err.response?.data
    if (status === 422) {
      if (body?.code === 'SISWA_ALREADY_PLACED') local.siswa = body.message
      else if (body?.errors) Object.entries(body.errors).forEach(([k, v]) => (fieldErrors[k] = v[0]))
      else toast.show(getErrorMessage(err), 'error')
    } else if (status && status < 500 && ![401, 403, 419, 429].includes(status)) {
      toast.show(getErrorMessage(err), 'error')
    }
  } finally {
    saving.value = false
  }
}
</script>