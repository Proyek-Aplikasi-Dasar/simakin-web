import api, { getErrorMessage } from '../services/api'

export async function downloadTemplate(type) {
  const { data } = await api.get(`/api/templates/${type}`, { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = `template-${type}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

export async function templateErrorMessage(err) {
  const body = err.response?.data
  if (body instanceof Blob) {
    try {
      return JSON.parse(await body.text()).message || 'Template tidak dapat diunduh.'
    } catch {
      return 'Template tidak dapat diunduh.'
    }
  }
  return getErrorMessage(err, 'Template tidak dapat diunduh.')
}

export async function uploadExcel(endpoint, file) {
  const body = new FormData()
  body.append('file', file)
  const { data } = await api.post(endpoint, body)
  return data
}

export function uploadErrorMessage(err) {
  const status = err.response?.status
  if (!status || status >= 500 || [401, 403, 419, 429].includes(status)) return null
  if (status === 404) return 'Endpoint import belum tersedia di BE.'
  return getErrorMessage(err, 'Import gagal.')
}