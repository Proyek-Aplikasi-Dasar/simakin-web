import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,   // kirim & terima cookie session
  withXSRFToken: true,     // wajib: FE (5173) dan BE (8000) beda origin
  headers: { Accept: 'application/json' },
})

// Minta cookie XSRF-TOKEN ke Laravel (dipanggil sebelum login)
export async function getCsrfCookie() {
  await api.get('/sanctum/csrf-cookie')
}

// Ambil pesan error yang enak dibaca dari response BE
export function getErrorMessage(error, fallback = 'Terjadi kesalahan.') {
  const data = error?.response?.data
  if (data?.errors) {
    const first = Object.values(data.errors)[0]
    if (Array.isArray(first) && first[0]) return first[0]
  }
  return data?.message || fallback
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error
    const toast = useToastStore()

    // Tidak ada response: server mati / jaringan putus / CORS gagal
    if (!response) {
      toast.show('Server tidak dapat dihubungi. Periksa koneksi internet.', 'error')
      return Promise.reject(error)
    }

    const status = response.status

    // 419: CSRF token kedaluwarsa -> ambil ulang cookie lalu ulangi request sekali
    if (status === 419 && config && !config._retry) {
      config._retry = true
      await getCsrfCookie()
      return api(config)
    }

    // 401: sesi habis / belum login
    if (status === 401) {
      useAuthStore().clear()

      // Request yang memang boleh 401 (cek sesi saat app start, logout) tidak perlu redirect
      if (!config?.skipAuthRedirect) {
        // import dinamis supaya tidak ada circular import dengan router
        const { default: router } = await import('../router')

        // Di halaman tamu (login, lupa password) tidak perlu toast/redirect
        if (!router.currentRoute.value.meta.guestOnly) {
          toast.show('Sesi berakhir, silakan login kembali.', 'error')
          router.push('/')
        }
      }
    }

    // 403: ditolak middleware role di BE
    else if (status === 403) {
      toast.show(response.data?.message || 'Anda tidak memiliki akses.', 'error')
    }

    // 429: terlalu banyak request
    else if (status === 429) {
      toast.show('Terlalu banyak percobaan. Coba lagi sebentar lagi.', 'error')
    }

    // 5xx: error server
    else if (status >= 500) {
      toast.show('Terjadi kesalahan pada server.', 'error')
    }

    // 422 (validasi) sengaja tidak ditangani di sini: ditampilkan oleh form masing-masing

    return Promise.reject(error)
  }
)

export default api