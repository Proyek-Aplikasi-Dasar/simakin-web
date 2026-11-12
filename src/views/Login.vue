<template>
  <div class="min-h-screen flex bg-white font-sans">
    <section class="hidden lg:flex relative overflow-hidden flex-col justify-between w-[640px] shrink-0 bg-blue-600 p-16">
      <div class="absolute left-[300px] -top-[160px] w-[520px] h-[520px] rounded-full bg-blue-700"></div>
      <div class="absolute -left-[120px] top-[640px] w-[360px] h-[360px] rounded-full bg-blue-700"></div>
      <div class="absolute left-[420px] top-[700px] w-[200px] h-[200px] rounded-full bg-blue-700"></div>

      <div class="relative flex items-center gap-3">
        <img src="../assets/logo-simakin.png" alt="" class="w-11 h-11" />
        <div>
          <p class="text-lg font-bold leading-[26px] text-white">SimakIn</p>
          <p class="text-[11px] leading-[14px] text-blue-200">SMK Negeri 1 Magelang</p>
        </div>
      </div>

      <div class="relative flex flex-col gap-5 w-[480px] max-w-full">
        <span class="self-start rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-semibold leading-[14px] text-slate-900">
          Sistem Informasi PKL
        </span>
        <h2 class="text-4xl font-bold leading-[44px] tracking-[-0.02em] text-white">
          {{ copy.headline }}
        </h2>
        <ul class="flex flex-col gap-5">
          <li v-for="point in copy.points" :key="point" class="flex items-center gap-3">
            <span class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700">
              <svg class="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <span class="text-sm text-white">{{ point }}</span>
          </li>
        </ul>
      </div>

      <p class="relative text-[11px] leading-[14px] text-blue-200">© 2026 SMK Negeri 1 Magelang</p>
    </section>

    <section class="flex flex-1 items-center justify-center p-6">
      <form class="flex w-[400px] max-w-full flex-col gap-6" @submit.prevent="handleLogin">
        <div class="flex flex-col gap-1.5">
          <h1 class="text-2xl font-bold leading-8 tracking-[-0.02em] text-slate-900">Masuk ke SimakIn</h1>
          <p class="text-xs leading-[18px] text-slate-600">{{ copy.subtitle }}</p>
        </div>

        <div class="flex gap-3">
          <label
            v-for="opt in roleOptions"
            :key="opt.value"
            :class="[
              'flex flex-1 cursor-pointer items-center gap-2.5 rounded-xl px-4 py-3',
              'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-300',
              selectedRole === opt.value
                ? 'border-[1.5px] border-blue-600 bg-blue-50'
                : 'border border-slate-200 bg-white',
            ]"
          >
            <input v-model="selectedRole" type="radio" name="role" :value="opt.value" class="sr-only" />
            <span
              :class="[
                'h-[18px] w-[18px] shrink-0 rounded-full bg-white',
                selectedRole === opt.value ? 'border-[5px] border-blue-600' : 'border-[1.5px] border-slate-300',
              ]"
            ></span>
            <span
              :class="['text-sm font-semibold', selectedRole === opt.value ? 'text-blue-600' : 'text-slate-600']"
            >
              {{ opt.label }}
            </span>
          </label>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="username" class="text-xs font-semibold leading-4 text-slate-900">
            {{ copy.usernameLabel }}
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            autocomplete="username"
            required
            :placeholder="copy.usernamePlaceholder"
            class="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-xs font-semibold leading-4 text-slate-900">Password</label>
          <div class="relative">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              placeholder="Masukkan password"
              class="h-10 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
              :aria-pressed="showPassword"
              class="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              @click="showPassword = !showPassword"
            >
              <svg v-if="!showPassword" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <path d="m2 2 20 20" />
              </svg>
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-label="Ingat saya"
              :aria-checked="remember"
              :class="[
                'flex h-6 w-10 items-center rounded-full px-[3px] transition-colors',
                remember ? 'justify-end bg-blue-600' : 'justify-start bg-slate-300',
              ]"
              @click="remember = !remember"
            >
              <span class="h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)]"></span>
            </button>
            <span class="text-xs font-medium text-slate-600">Ingat saya</span>
          </div>
          <router-link to="/forgot-password" class="text-xs font-semibold text-blue-600">
            Lupa password?
          </router-link>
        </div>

        <p v-if="errorMsg" class="text-xs text-red-600">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>

        <p class="text-[11px] leading-[14px] text-slate-500">{{ copy.help }}</p>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getErrorMessage } from '../services/api'

const router = useRouter()
const auth = useAuthStore()

const content = {
  admin: {
    headline: 'Kelola PKL seluruh siswa dalam satu panel.',
    points: [
      'Pantau presensi dan jurnal seluruh siswa',
      'Verifikasi pengajuan dan penempatan PKL',
      'Kelola akun, data master, dan laporan',
    ],
    subtitle: 'Gunakan akun administrator sekolah.',
    help: 'Butuh bantuan? Hubungi pengelola sistem sekolah.',
    usernameLabel: 'Username',
    usernamePlaceholder: 'Masukkan username',
  },
  guru: {
    headline: 'Pantau PKL siswa bimbingan dalam satu tempat.',
    points: [
      'Pantau presensi dan jurnal harian secara real-time',
      'Input nilai akhir siswa lebih cepat',
      'Chat langsung dengan siswa bimbingan',
    ],
    subtitle: 'Gunakan akun yang diberikan admin sekolah.',
    help: 'Butuh bantuan? Hubungi admin TU sekolah.',
    usernameLabel: 'Username / NIP',
    usernamePlaceholder: 'Masukkan username atau NIP',
  },
}

const roleOptions = [
  { value: 'guru', label: 'Guru Pembimbing' },
  { value: 'admin', label: 'Administrator' },
]

const STORAGE_PREFIX = 'simakin:login:'
const ROLES = ['guru', 'admin']

function readStore(key) {
  try {
    return localStorage.getItem(STORAGE_PREFIX + key)
  } catch {
    return null
  }
}
function writeStore(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, value)
  } catch {
  }
}
function removeStore(key) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key)
  } catch {
  }
}

const lastRole = readStore('role')
const selectedRole = ref(ROLES.includes(lastRole) ? lastRole : 'admin') 
const copy = computed(() => content[selectedRole.value])
const username = ref(readStore(`username:${selectedRole.value}`) ?? '')
const password = ref('')
const showPassword = ref(false)
const remember = ref(true)
const errorMsg = ref('')
const loading = ref(false)

watch(selectedRole, (role) => {
  username.value = readStore(`username:${role}`) ?? ''
})

async function handleLogin() {
  if (loading.value) return
  errorMsg.value = ''
  loading.value = true

  try {
    await auth.login(username.value, password.value)

    if (auth.role !== selectedRole.value) {
      await auth.logout()
      errorMsg.value = 'Akun ini bukan akun ' +
        (selectedRole.value === 'guru' ? 'Guru Pembimbing.' : 'Administrator.')
      return
    }

    if (remember.value) {
      writeStore('role', selectedRole.value)
      writeStore(`username:${selectedRole.value}`, username.value)
    } else {
      removeStore('role')
      removeStore(`username:${selectedRole.value}`)
    }

    router.push(auth.homePath)
  } catch (err) {
    if (err.message === 'ROLE_NOT_ALLOWED') {
      errorMsg.value = 'Akun siswa menggunakan aplikasi mobile SimakIn.'
    } else if (err.response?.status === 422) {
      errorMsg.value = getErrorMessage(err, 'Data yang dimasukkan tidak valid.')
    } else if (err.response?.status === 419) {
      errorMsg.value = 'Sesi tidak valid, muat ulang halaman lalu coba lagi.'
    } else if (!err.response) {
      errorMsg.value = 'Server tidak dapat dihubungi.'
    } else {
      errorMsg.value = 'Terjadi kesalahan, coba lagi.'
    }
  } finally {
    loading.value = false
  }
}
</script>