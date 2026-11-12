const isEmpty = (v) =>
  v === null ||
  v === undefined ||
  (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.length === 0)

export const required =
  (msg = 'Wajib diisi.') =>
  (v) =>
    isEmpty(v) ? msg : ''

export const email =
  (msg = 'Format email tidak valid.') =>
  (v) =>
    isEmpty(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()) ? '' : msg

export const phone =
  (msg = 'Nomor telepon tidak valid.') =>
  (v) =>
    isEmpty(v) || /^[0-9+\-\s()]{8,20}$/.test(String(v).trim()) ? '' : msg

export const minLength = (n, msg) => (v) =>
  isEmpty(v) || String(v).trim().length >= n ? '' : (msg ?? `Minimal ${n} karakter.`)

export const maxLength = (n, msg) => (v) =>
  isEmpty(v) || String(v).trim().length <= n ? '' : (msg ?? `Maksimal ${n} karakter.`)

export const numeric =
  (msg = 'Harus berupa angka.') =>
  (v) =>
    isEmpty(v) || Number.isFinite(Number(String(v).trim())) ? '' : msg

export const integer =
  (msg = 'Harus berupa bilangan bulat.') =>
  (v) =>
    isEmpty(v) || /^-?\d+$/.test(String(v).trim()) ? '' : msg

export const min = (n, msg) => (v) =>
  isEmpty(v) || Number(v) >= n ? '' : (msg ?? `Minimal ${n}.`)

export const max = (n, msg) => (v) =>
  isEmpty(v) || Number(v) <= n ? '' : (msg ?? `Maksimal ${n}.`)

export const latitude = () => (v) => {
  if (isEmpty(v)) return ''
  const n = Number(String(v).trim())
  if (!Number.isFinite(n)) return 'Latitude harus berupa angka.'
  return n < -90 || n > 90 ? 'Latitude harus antara -90 dan 90.' : ''
}

export const longitude = () => (v) => {
  if (isEmpty(v)) return ''
  const n = Number(String(v).trim())
  if (!Number.isFinite(n)) return 'Longitude harus berupa angka.'
  return n < -180 || n > 180 ? 'Longitude harus antara -180 dan 180.' : ''
}