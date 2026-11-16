<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Pengguna' }, { label: 'Akun & Peran' }]"
      title="Akun & Peran"
      subtitle="Kelola akun login dan hak akses seluruh pengguna sistem."
    >
      <router-link
        to="/admin/akun-peran/tambah"
        class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold leading-5 text-white hover:bg-blue-700"
      >
        <AppIcon name="user-plus" class="h-5 w-5" />
        Tambah Akun
      </router-link>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" :loading="loadingCounts" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Daftar Akun Pengguna" description="Daftar pengguna terdaftar beserta peran dan status akun." />

        <div class="flex gap-6 overflow-x-auto border-b border-slate-200 px-6">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            :disabled="tab.disabled"
            :title="tab.disabled ? 'Menunggu status akun dari BE' : undefined"
            :class="[
              'flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-semibold',
              tab.disabled
                ? 'cursor-not-allowed border-transparent text-slate-400 opacity-60'
                : tab.key === activeTab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900',
            ]"
            @click="selectTab(tab.key)"
          >
            {{ tab.label }}
            <span
              v-if="counts[tab.key] != null"
              :class="[
                'rounded-full px-2 py-0.5 text-[11px]',
                tab.key === activeTab ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500',
              ]"
            >
              {{ counts[tab.key] }}
            </span>
            <span v-else-if="loadingCounts" class="h-[18px] w-6 animate-pulse rounded-full bg-slate-200"></span>
          </button>
        </div>

        <form class="flex flex-wrap items-center gap-3 px-6 py-4" @submit.prevent="applyFilters">
          <label
            class="flex h-10 min-w-[240px] flex-1 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-100 px-3 focus-within:ring-2 focus-within:ring-blue-200"
          >
            <AppIcon name="search" class="h-5 w-5 shrink-0 text-slate-400" />
            <input
              ref="searchInput"
              v-model="draftSearch"
              type="text"
              placeholder="Cari nama, email, atau username…"
              class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <span class="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium leading-[14px] text-slate-500">
              Ctrl K
            </span>
          </label>

          <SelectDropdown
            v-model="draftRole"
            class="w-[220px]"
            icon="shield"
            placeholder="Semua Peran"
            :options="roleItems"
          />

          <button
            type="submit"
            class="flex h-10 items-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-600 hover:bg-blue-100"
          >
            <AppIcon name="filter" class="h-5 w-5" />
            Terapkan
          </button>
        </form>

        <div class="flex items-center gap-4 border-t border-slate-100 bg-slate-100 px-6 py-2.5">
          <span
            v-for="col in columns"
            :key="col.label"
            :class="[col.width, col.align, 'text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500']"
          >
            {{ col.label }}
          </span>
        </div>

        <div v-if="loading && !rows.length" class="divide-y divide-slate-100" role="status" aria-busy="true" aria-label="Memuat data akun">
          <div v-for="i in 6" :key="i" class="flex items-center gap-4 px-6 py-3">
            <div class="flex min-w-0 flex-1 items-center gap-2.5">
              <span class="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200"></span>
              <div class="flex min-w-0 flex-1 flex-col gap-2">
                <span class="h-3 w-36 max-w-full animate-pulse rounded bg-slate-200"></span>
                <span class="h-2.5 w-44 max-w-full animate-pulse rounded bg-slate-100"></span>
              </div>
            </div>
            <span class="h-3 w-[140px] animate-pulse rounded bg-slate-200"></span>
            <span class="h-6 w-[90px] animate-pulse rounded-full bg-slate-100"></span>
            <div class="flex w-[140px] justify-end gap-2">
              <span v-for="b in 3" :key="b" class="h-10 w-10 animate-pulse rounded-xl bg-slate-100"></span>
            </div>
          </div>
        </div>
        <div v-else-if="error" class="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p class="text-sm text-red-600">{{ error }}</p>
          <button
            type="button"
            class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50"
            @click="loadUsers"
          >
            Coba lagi
          </button>
        </div>
        <p v-else-if="!rows.length" class="px-6 py-12 text-center text-sm text-slate-400">
          Tidak ada akun yang cocok.
        </p>

        <div v-else :class="['divide-y divide-slate-100', loading && 'opacity-60']">
          <div v-for="row in rows" :key="row.id" class="flex items-center gap-4 px-6 py-3">
            <div class="flex min-w-0 flex-1 items-center gap-2.5">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <AppIcon name="user" class="h-5 w-5" />
              </span>
              <div class="flex min-w-0 flex-col">
                <span class="truncate text-xs font-semibold leading-[18px] text-slate-900">{{ row.name }}</span>
                <span class="truncate text-[11px] leading-[14px] text-slate-500">{{ row.sub }}</span>
              </div>
            </div>

            <span class="w-[140px] truncate text-xs leading-[18px] text-slate-600">{{ row.username }}</span>

            <div class="w-[90px]">
              <span
                :class="['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', roleBadge[row.role].box]"
              >
                <span :class="['h-1.5 w-1.5 rounded-full', roleBadge[row.role].dot]" />
                {{ roleBadge[row.role].label }}
              </span>
            </div>

            <div class="flex w-[140px] justify-end gap-2">
              <router-link
                :to="`/admin/akun-peran/${row.id}/edit`"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Edit akun"
                title="Edit akun"
              >
                <AppIcon name="pencil" class="h-5 w-5" />
              </router-link>
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Reset kata sandi"
                title="Reset kata sandi"
                @click="userToReset = row"
              >
                <AppIcon name="key-round" class="h-5 w-5" />
              </button>
              <button
                type="button"
                :disabled="row.id === auth.user?.id"
                :title="row.id === auth.user?.id ? 'Tidak dapat menghapus akun sendiri' : 'Hapus akun'"
                aria-label="Hapus akun"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600"
                @click="userToDelete = row"
              >
                <AppIcon name="trash" class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <DataPagination
          :page="page"
          :last-page="meta.last_page"
          :total="meta.total"
          :from="meta.from"
          :to="meta.to"
          item-label="akun"
          @update:page="goTo"
        />
      </section>
    </div>

    <ConfirmDialog
      :show="!!userToDelete"
      title="Hapus akun?"
      :message="`Akun ${userToDelete?.name ?? ''} akan dihapus dan tidak bisa login lagi.`"
      :loading="deleting"
      @cancel="userToDelete = null"
      @confirm="confirmDelete"
    />

    <ResetPasswordDialog
      :show="!!userToReset"
      :user="userToReset"
      @close="userToReset = null"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api, { getErrorMessage } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import { ROLE_MAP, ROLE_ID_BY_NAME } from '../../constants/roles'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import DataPagination from '../../components/DataPagination.vue'
import ResetPasswordDialog from '../../components/ResetPasswordDialog.vue'
import SelectDropdown from '../../components/SelectDropdown.vue'
import { useListState } from '../../composables/useListState'
import { useSearchShortcut } from '../../composables/useSearchShortcut'

const auth = useAuthStore()
const toast = useToastStore()

const tabs = [
  { key: 'semua', label: 'Semua' },
  { key: 'admin', label: 'Admin' },
  { key: 'guru', label: 'Guru' },
  { key: 'siswa', label: 'Siswa' },
]

const roleItems = [
  { value: '', label: 'Semua Peran' },
  { value: 'admin', label: 'Administrator' },
  { value: 'guru', label: 'Guru Pembimbing' },
  { value: 'siswa', label: 'Siswa' },
]

const columns = [
  { label: 'Pengguna', width: 'flex-1', align: '' },
  { label: 'Username', width: 'w-[140px]', align: '' },
  { label: 'Peran', width: 'w-[90px]', align: '' },
  { label: 'Aksi', width: 'w-[140px]', align: 'text-right' },
]

const roleBadge = {
  admin: { label: 'Admin', box: 'border-yellow-200 bg-yellow-50 text-yellow-700', dot: 'bg-yellow-700' },
  guru: { label: 'Guru', box: 'border-blue-200 bg-blue-50 text-blue-700', dot: 'bg-blue-700' },
  siswa: { label: 'Siswa', box: 'border-slate-200 bg-slate-100 text-slate-600', dot: 'bg-slate-600' },
}

const rows = ref([])
const loading = ref(false)
const error = ref('')
const page = ref(1)
const meta = reactive({ total: 0, from: 0, to: 0, last_page: 1 })
const counts = reactive({ semua: null, admin: null, guru: null, siswa: null })
const loadingCounts = ref(true)


const draftSearch = ref('')
const draftRole = ref('')
const applied = reactive({ search: '', role: '' })

const activeTab = computed(() => applied.role || 'semua')

const userToDelete = ref(null)
const deleting = ref(false)
const userToReset = ref(null)

useListState('akun-peran', ['/admin/akun-peran/'], {
  snapshot: () => ({ page: page.value, applied: { ...applied } }),
  restore: (s) => {
    page.value = s.page
    Object.assign(applied, s.applied)
    draftSearch.value = s.applied.search
    draftRole.value = s.applied.role
  },
})
const searchInput = ref(null)
useSearchShortcut(searchInput)

const stats = computed(() => [
  { label: 'Total Akun', icon: 'users', tone: 'blue', value: counts.semua, hint: 'terdaftar di sistem' },
  { label: 'Administrator', icon: 'shield', tone: 'amber', value: counts.admin, hint: 'akses penuh' },
  { label: 'Guru Pembimbing', icon: 'user-check', tone: 'blue', value: counts.guru, hint: 'akses panel guru' },
  { label: 'Siswa', icon: 'cap', tone: 'green', value: counts.siswa, hint: 'akses aplikasi mobile' },
])


function normalize(u) {
  const role = u.role?.nama ?? ROLE_MAP[u.role_id] ?? 'siswa'
  let sub = u.email || '—'
  if (role === 'siswa' && u.siswa?.nis) sub = `NIS ${u.siswa.nis}`
  else if (!u.email && role === 'guru' && u.guru?.nip) sub = `NIP ${u.guru.nip}`

  return {
    id: u.id,
    name: u.name,
    username: u.username,
    role,
    sub,
  }
}

let requestId = 0

async function loadUsers() {
  const current = ++requestId 
  loading.value = true
  error.value = ''
  try {
    const params = { page: page.value }
    if (applied.search) params.search = applied.search
    if (applied.role) params.role_id = ROLE_ID_BY_NAME[applied.role]

    const { data } = await api.get('/api/users', { params })
    if (current !== requestId) return

    rows.value = data.data.map(normalize)
    meta.total = data.meta?.total ?? rows.value.length
    meta.from = data.meta?.from ?? 0
    meta.to = data.meta?.to ?? 0
    meta.last_page = data.meta?.last_page ?? 1
  } catch (err) {
    if (current !== requestId) return
    rows.value = []
    error.value = getErrorMessage(err, 'Gagal memuat data akun.')
  } finally {
    if (current === requestId) loading.value = false
  }
}

async function loadCounts() {
  const targets = { semua: null, admin: 1, guru: 2, siswa: 3 }
  await Promise.all(
    Object.entries(targets).map(async ([key, roleId]) => {
      try {
        const { data } = await api.get('/api/users', { params: roleId ? { role_id: roleId } : {} })
        counts[key] = data.meta?.total ?? data.data.length
      } catch {
        counts[key] = null
      }
    })
  )
  loadingCounts.value = false
}

function applyFilters() {
  applied.search = draftSearch.value.trim()
  applied.role = draftRole.value
  page.value = 1
  loadUsers()
}

function selectTab(key) {
  draftRole.value = key === 'semua' ? '' : key
  applyFilters()
}

function goTo(p) {
  if (p < 1 || p > meta.last_page || p === page.value) return
  page.value = p
  loadUsers()
}

async function confirmDelete() {
  const target = userToDelete.value
  if (!target || deleting.value) return
  deleting.value = true
  try {
    const { data } = await api.delete(`/api/users/${target.id}`)
    toast.show(data.message || 'Akun berhasil dihapus.')
    userToDelete.value = null
    if (rows.value.length === 1 && page.value > 1) page.value--
    await Promise.all([loadUsers(), loadCounts()])
  } catch (err) {
    const status = err.response?.status
    if (status && status < 500 && ![401, 403, 419, 429].includes(status)) {
      toast.show(getErrorMessage(err), 'error')
    }
    userToDelete.value = null
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadUsers()
  loadCounts()
})
</script>