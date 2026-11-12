import api from '../services/api'

export async function fetchAllPages(url, params = {}) {
  const first = await api.get(url, { params: { ...params, page: 1 } })
  const last = first.data.meta?.last_page ?? 1
  let rows = first.data.data
  if (last > 1) {
    const rest = await Promise.all(
      Array.from({ length: last - 1 }, (_, i) => api.get(url, { params: { ...params, page: i + 2 } }))
    )
    rows = rows.concat(...rest.map((r) => r.data.data))
  }
  return rows
}

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export function parseDate(value) {
  if (!value) return null
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toIso(date) {
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

export function formatDate(value, pad = false) {
  const d = parseDate(value)
  if (!d) return '—'
  const day = pad ? String(d.getDate()).padStart(2, '0') : d.getDate()
  return `${day} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

export function formatShort(value) {
  const d = parseDate(value)
  return d ? `${d.getDate()} ${BULAN[d.getMonth()]}` : '—'
}

export function hariName(value) {
  const d = parseDate(value)
  return d ? HARI[d.getDay()] : ''
}

export function jamOnly(time) {
  return time ? String(time).slice(0, 5) : '—'
}

export const PKL_STATUS = {
  aktif: { label: 'Aktif', box: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-700' },
  belum: { label: 'Belum Ditempatkan', box: 'border-yellow-200 bg-yellow-50 text-yellow-700', dot: 'bg-yellow-700' },
  selesai: { label: 'Selesai', box: 'border-blue-200 bg-blue-50 text-blue-700', dot: 'bg-blue-700' },
}

export const ABSEN_STATUS = {
  hadir: { label: 'Hadir', box: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-700' },
  izin: { label: 'Izin', box: 'border-blue-200 bg-blue-50 text-blue-700', dot: 'bg-blue-700' },
  sakit: { label: 'Sakit', box: 'border-yellow-200 bg-yellow-50 text-yellow-700', dot: 'bg-yellow-700' },
  libur: { label: 'Libur', box: 'border-slate-200 bg-slate-100 text-slate-600', dot: 'bg-slate-600' },
}

export const LOKASI_STATUS = {
  pending: 'Menunggu',
  active: 'Aktif',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

export function pickLokasi(list = []) {
  const newest = [...list].sort((a, b) => b.id - a.id)
  return newest.find((l) => l.status === 'active') || newest.find((l) => l.status === 'completed') || null
}

export function pklStatusOf(lokasi) {
  if (!lokasi) return 'belum'
  return lokasi.status === 'active' ? 'aktif' : 'selesai'
}

export function groupBySiswa(lokasiList) {
  const groups = new Map()
  for (const l of lokasiList) {
    const id = l.siswa?.id
    if (!id) continue
    if (!groups.has(id)) groups.set(id, [])
    groups.get(id).push(l)
  }
  const picked = new Map()
  groups.forEach((list, id) => picked.set(id, pickLokasi(list)))
  return picked
}

export function hitungKehadiran(rows) {
  const c = { hadir: 0, izin: 0, sakit: 0, libur: 0 }
  rows.forEach((r) => {
    if (r.status in c) c[r.status]++
  })
  const efektif = rows.length - c.libur
  return { ...c, total: rows.length, efektif, persen: efektif > 0 ? Math.round((c.hadir / efektif) * 100) : null }
}