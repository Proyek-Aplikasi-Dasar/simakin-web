export const PENGAJUAN_STATUS = {
  pending: { label: 'Menunggu', box: 'border-yellow-200 bg-yellow-50 text-yellow-700' },
  approved: { label: 'Diterima', box: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Ditolak', box: 'border-red-200 bg-red-50 text-red-700' },
}

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const TZ = 'Asia/Jakarta'

function partsOf(iso) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const p = {}
  for (const part of fmt.formatToParts(date)) p[part.type] = part.value

  return {
    y: Number(p.year),
    m: Number(p.month),
    d: Number(p.day),
    hh: p.hour === '24' ? '00' : p.hour,
    mm: p.minute,
  }
}

export function formatTanggal(iso) {
  const p = partsOf(iso)
  return p ? `${String(p.d).padStart(2, '0')} ${BULAN[p.m - 1]} ${p.y}` : '—'
}

export function formatWaktu(iso) {
  const p = partsOf(iso)
  return p ? `${p.d} ${BULAN[p.m - 1]} ${p.y}, ${p.hh}:${p.mm} WIB` : '—'
}

export function monthKey(iso) {
  const p = partsOf(iso)
  return p ? `${p.y}-${String(p.m).padStart(2, '0')}` : ''
}

export function monthLabel(key) {
  const [y, m] = String(key).split('-').map(Number)
  return y && m ? `${BULAN[m - 1]} ${y}` : key
}