import api from '../services/api'
import { cachedRequest } from './requestCache'

async function loadAllPages(url, params) {
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

function ttlFor(url) {
  return url.startsWith('/api/absensi') ? 10_000 : 60_000
}

export async function fetchAllPages(url, params = {}) {
  const key = `${url}?${JSON.stringify(params)}`
  const rows = await cachedRequest(key, () => loadAllPages(url, params), ttlFor(url))
  return rows.slice()
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

export function hariKerja(from, to) {
  const a = parseDate(from)
  const b = parseDate(to)
  if (!a || !b || a > b) return 0
  let n = 0
  for (const d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    const w = d.getDay()
    if (w !== 0 && w !== 6) n++
  }
  return n
}

export function rentangEfektif(from, to, lokasi, today = toIso(new Date())) {
  let awal = from
  let akhir = to < today ? to : today
  const mulai = lokasi?.tanggal_mulai ? String(lokasi.tanggal_mulai).slice(0, 10) : null
  const selesai = lokasi?.tanggal_selesai ? String(lokasi.tanggal_selesai).slice(0, 10) : null
  if (mulai && mulai > awal) awal = mulai
  if (selesai && selesai < akhir) akhir = selesai
  return { from: awal, to: akhir }
}

export function hitungEfektif(c, from, to) {
  return Math.max(c.hadir + c.izin + c.sakit, hariKerja(from, to) - c.libur)
}

export function hitungKehadiran(rows) {
  const c = { hadir: 0, izin: 0, sakit: 0, libur: 0 }
  rows.forEach((r) => {
    if (r.status in c) c[r.status]++
  })
  const efektif = rows.length - c.libur
  return { ...c, total: rows.length, efektif, persen: efektif > 0 ? Math.round((c.hadir / efektif) * 100) : null }
}