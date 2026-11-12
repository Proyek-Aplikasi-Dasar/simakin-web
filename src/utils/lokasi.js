export const LOKASI_BADGE = {
  pending: { label: 'Menunggu', box: 'border-yellow-200 bg-yellow-50 text-yellow-700', dot: 'bg-yellow-700' },
  active: { label: 'Aktif', box: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-700' },
  completed: { label: 'Selesai', box: 'border-blue-200 bg-blue-50 text-blue-700', dot: 'bg-blue-700' },
  cancelled: { label: 'Dibatalkan', box: 'border-red-100 bg-red-50 text-red-700', dot: 'bg-red-700' },
}

export const LOKASI_NEXT = {
  pending: [
    { status: 'active', label: 'Aktifkan' },
    { status: 'cancelled', label: 'Batalkan' },
  ],
  active: [
    { status: 'completed', label: 'Selesaikan' },
    { status: 'cancelled', label: 'Batalkan' },
  ],
  completed: [],
  cancelled: [],
}

export const MEMAKAI_KUOTA = ['pending', 'active']

export function terisiOf(list = []) {
  return list.filter((l) => MEMAKAI_KUOTA.includes(l.status)).length
}