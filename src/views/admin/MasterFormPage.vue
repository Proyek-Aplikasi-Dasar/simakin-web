<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Data Master', to: backTo }, { label: pageTitle }]"
      :title="pageTitle"
      :subtitle="cfg.subtitle"
    >
      <router-link
        :to="backTo"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </router-link>
    </PageHeader>

    <form class="max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm" @submit.prevent="submit">
      <div class="p-6">
        <h2 class="text-base font-semibold text-slate-900">Form {{ cfg.label }}</h2>
        <p class="mt-0.5 text-xs text-slate-500">{{ cfg.hint }}</p>

        <p v-if="loadError" class="mt-5 rounded-lg bg-red-50 p-3 text-xs text-red-600">{{ loadError }}</p>
        <p v-else-if="loading" class="mt-5 text-sm text-slate-500">Memuat data...</p>

        <div v-else class="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div v-for="f in cfg.fields" :key="f.key" :class="f.select ? 'md:col-span-2' : ''">
            <label :for="f.key" class="mb-1.5 block text-xs font-semibold text-slate-900">{{ f.label }}</label>

            <select
              v-if="f.select"
              :id="f.key"
              v-model="form[f.key]"
              :class="[inputBase, fieldErrors[f.key] ? 'border-red-500' : 'border-slate-200']"
            >
              <option value="" disabled>Pilih jurusan</option>
              <option v-for="j in jurusanList" :key="j.id" :value="j.id">{{ j.nama }}</option>
            </select>

            <input
              v-else
              :id="f.key"
              v-model="form[f.key]"
              type="text"
              :placeholder="f.placeholder"
              :class="[inputBase, fieldErrors[f.key] ? 'border-red-500' : 'border-slate-200']"
            />

            <p v-if="fieldErrors[f.key]" class="mt-1 text-xs text-red-600">{{ fieldErrors[f.key] }}</p>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
        <router-link :to="backTo" class="px-3 text-sm font-semibold text-blue-600">Batal</router-link>
        <button
          type="submit"
          :disabled="saving || loading || !!loadError"
          class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <AppIcon name="save" class="h-4 w-4" />
          {{ saving ? 'Menyimpan...' : `Simpan ${cfg.label}` }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '../../components/PageHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import api, { getErrorMessage } from '../../services/api'
import { useMasterResource, fetchAll } from '../../composables/useMasterResource'

const props = defineProps({
  type: { type: String, required: true }, // 'jurusan' | 'kompetensi'
  id: { type: String, default: null },    // ada = mode edit
})

const router = useRouter()

const CONFIG = {
  jurusan: {
    label: 'Jurusan',
    endpoint: '/api/jurusan',
    subtitle: 'Jurusan muncul di data siswa dan penempatan PKL.',
    hint: 'Pastikan kode unik untuk tiap jurusan.',
    fields: [
      { key: 'kode', label: 'Kode', placeholder: 'Masukkan kode' },
      { key: 'nama', label: 'Nama Jurusan', placeholder: 'Masukkan nama jurusan' },
    ],
  },
  kompetensi: {
    label: 'Kompetensi',
    endpoint: '/api/kompetensi',
    subtitle: 'Kompetensi terhubung ke satu jurusan.',
    hint: 'Pilih jurusan, lalu isi kode dan nama kompetensi.',
    fields: [
      { key: 'jurusan_id', label: 'Jurusan', select: true },
      { key: 'kode', label: 'Kode', placeholder: 'Masukkan kode' },
      { key: 'nama', label: 'Nama Kompetensi', placeholder: 'Masukkan nama kompetensi' },
    ],
  },
}

const cfg = CONFIG[props.type]
const isEdit = !!props.id
const pageTitle = `${isEdit ? 'Edit' : 'Tambah'} ${cfg.label}`
const backTo = { name: 'data-master', query: { tab: props.type } }
const inputBase =
  'h-10 w-full rounded-xl border bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'

const form = reactive({})
cfg.fields.forEach((f) => (form[f.key] = ''))

const jurusanList = ref([])
const loading = ref(true)
const loadError = ref('')

const { saving, fieldErrors, save } = useMasterResource(cfg.endpoint, { name: cfg.label, reload: false })

onMounted(async () => {
  try {
    const tasks = []

    if (props.type === 'kompetensi') {
      tasks.push(fetchAll('/api/jurusan').then((list) => (jurusanList.value = list)))
    }

    if (isEdit) {
      tasks.push(
        api.get(`${cfg.endpoint}/${props.id}`).then(({ data }) => {
          cfg.fields.forEach((f) => (form[f.key] = data.data[f.key] ?? ''))
        })
      )
    }

    await Promise.all(tasks)
  } catch (err) {
    loadError.value =
      err.response?.status === 404
        ? 'Data tidak ditemukan.'
        : getErrorMessage(err, 'Gagal memuat data.')
  } finally {
    loading.value = false
  }
})

async function submit() {
  const ok = await save({
    mode: isEdit ? 'edit' : 'create',
    row: { id: props.id },
    values: { ...form },
  })
  if (ok) router.push(backTo)
}
</script>