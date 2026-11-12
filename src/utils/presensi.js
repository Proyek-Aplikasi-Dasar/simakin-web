import api from '../services/api'
import { ABSEN_STATUS } from './siswa'

export const PRESENSI_STATUS = {
  ...ABSEN_STATUS,
  belum: { label: 'Belum Presensi', box: 'border-red-100 bg-red-50 text-red-700', dot: 'bg-red-700' },
}

export function fotoUrl(path) {
  if (!path) return null
  if (/^https?:/.test(path)) return path
  return `${api.defaults.baseURL}${path}`
}

export function jarakMeter(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v == null || v === '')) return null
  const rad = (d) => (Number(d) * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLon = rad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatJarak(m) {
  if (m == null) return '—'
  return m < 1000 ? `${Math.round(m)} meter` : `${(m / 1000).toFixed(1).replace('.', ',')} km`
}