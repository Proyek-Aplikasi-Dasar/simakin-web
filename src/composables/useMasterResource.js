import { ref } from 'vue'
import api, { getErrorMessage } from '../services/api'
import { useToastStore } from '../stores/toast'

export async function fetchAll(url) {
  let page = 1
  let lastPage = 1
  let all = []

  do {
    const { data } = await api.get(url, { params: { page } })
    all = all.concat(data.data)
    lastPage = data.meta?.last_page ?? 1
    page++
  } while (page <= lastPage)

  return all
}

// Logika CRUD yang dipakai ulang oleh semua halaman Data Master
// endpoint  : contoh '/api/jurusan'
// name      : nama data untuk pesan, contoh 'Jurusan'
// normalize : (opsional) ubah bentuk tiap baris sebelum masuk tabel
// reload    : (opsional) ambil ulang daftar setelah simpan; matikan di halaman form
export function useMasterResource(
  endpoint,
  { name = 'Data', normalize = (row) => row, reload = true } = {}
) {
  const toast = useToastStore()

  const rows = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const fieldErrors = ref({}) // { nama: 'pesan error', ... } dari respons 422

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const list = await fetchAll(endpoint)
      rows.value = list.map(normalize)
    } catch (err) {
      error.value = getErrorMessage(err, `Gagal memuat data ${name.toLowerCase()}.`)
    } finally {
      loading.value = false
    }
  }

  function clearErrors() {
    fieldErrors.value = {}
  }

  async function save({ mode, row, values }) {
    if (saving.value) return false
    saving.value = true
    clearErrors()

    try {
      const { data } =
        mode === 'edit'
          ? await api.put(`${endpoint}/${row.id}`, values)
          : await api.post(endpoint, values)

      toast.show(data.message || `${name} berhasil disimpan.`)
      if (reload) await load()
      return true
    } catch (err) {
      const status = err.response?.status

      if (status === 422) {
        // Laravel: { errors: { nama: ['pesan1', 'pesan2'] } } -> ambil pesan pertama tiap field
        const errors = err.response.data?.errors ?? {}
        fieldErrors.value = Object.fromEntries(
          Object.entries(errors).map(([field, messages]) => [field, messages[0]])
        )
      } else if (status && status < 500 && ![401, 403, 419, 429].includes(status)) {
        // 401/403/419/429/5xx sudah ditangani interceptor di api.js
        toast.show(getErrorMessage(err), 'error')
      }
      return false
    } finally {
      saving.value = false
    }
  }

  async function remove(row) {
    try {
      const { data } = await api.delete(`${endpoint}/${row.id}`)
      toast.show(data.message || `${name} berhasil dihapus.`)
      await load()
      return true
    } catch (err) {
      const status = err.response?.status
      if (status && status < 500 && ![401, 403, 419, 429].includes(status)) {
        toast.show(getErrorMessage(err), 'error')
      }
      return false
    }
  }

  return { rows, loading, saving, error, fieldErrors, load, save, remove, clearErrors }
}