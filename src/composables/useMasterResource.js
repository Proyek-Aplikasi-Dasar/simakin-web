import { ref } from 'vue'
import api, { getErrorMessage } from '../services/api'
import { useToastStore } from '../stores/toast'
import { fetchAllPages } from '../utils/siswa'

export function fetchAll(url) {
  return fetchAllPages(url)
}

export function useMasterResource(
  endpoint,
  { name = 'Data', normalize = (row) => row, reload = true } = {}
) {
  const toast = useToastStore()

  const rows = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const fieldErrors = ref({}) 

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
        const errors = err.response.data?.errors ?? {}
        fieldErrors.value = Object.fromEntries(
          Object.entries(errors).map(([field, messages]) => [field, messages[0]])
        )
      } else if (status && status < 500 && ![401, 403, 419, 429].includes(status)) {
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