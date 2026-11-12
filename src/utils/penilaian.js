import api from '../services/api'
import { fetchAllPages, pickLokasi, hitungKehadiran, formatDate } from './siswa'
import { required, numeric, min, max } from './validators'

export const NILAI_MIN = 0
export const NILAI_MAX = 100

export const nilaiRules = () => [
  required('Kolom ini wajib diisi.'),
  numeric('Nilai harus berupa angka.'),
  min(NILAI_MIN, `Nilai minimal ${NILAI_MIN}.`),
  max(NILAI_MAX, `Nilai maksimal ${NILAI_MAX}.`),
]

export const fmtNilai = (n) => (n == null || n === '' ? '—' : Number(n).toLocaleString('id-ID', { maximumFractionDigits: 1 }))

const BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export function namaBulan(periode) {
  if (!periode) return ''
  if (!/^\d{4}-\d{1,2}$/.test(String(periode))) return String(periode)
  const [y, m] = String(periode).split('-').map(Number)
  return BULAN_PANJANG[m - 1] ? `${BULAN_PANJANG[m - 1]} ${y}` : String(periode)
}

export async function fetchRingkasSiswa(siswaId) {
  const [s, lok, abs] = await Promise.all([
    api.get(`/api/siswa/${siswaId}`),
    api.get(`/api/siswa/${siswaId}/lokasi-pkl`),
    fetchAllPages('/api/absensi', { siswa_id: siswaId }),
  ])

  const siswa = s.data.data
  const lokasi = pickLokasi(lok.data.data)
  const gid = lokasi?.gelombang?.id ?? siswa.gelombang?.id
  const g = gid ? await api.get(`/api/gelombang/${gid}`).catch(() => null) : null
  const gelombang = g?.data?.data ?? null
  const k = hitungKehadiran(abs)

  return {
    siswa: {
      id: siswa.id,
      nama: siswa.user?.name ?? '',
      nis: siswa.nis,
      kelas: siswa.kelas,
      jurusanId: siswa.jurusan?.id ?? null,
    },
    info: {
      programStudi: siswa.jurusan?.nama ?? '',
      tempat: lokasi?.perusahaan?.nama ?? '',
      guru: lokasi?.guru?.nama ?? '',
      pembimbingIndustri: '',
      periode: gelombang ? `${formatDate(gelombang.praktik_mulai)} – ${formatDate(gelombang.praktik_selesai)}` : '',
    },
    rekap: {
      nilaiBulanLalu: null, 
      rataRataBulanan: null, 
      kehadiran: k.persen,
      jurnalTerkirim: null, 
    },
  }
}
