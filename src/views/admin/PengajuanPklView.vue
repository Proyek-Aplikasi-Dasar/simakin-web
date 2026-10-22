<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'PKL' }, { label: 'Pengajuan PKL' }]"
      title="Pengajuan PKL"
      subtitle="Siswa memilih tempat PKL dari daftar perusahaan yang dibuka admin."
    >
      <button
        type="button"
        disabled
        title="Menunggu endpoint BE"
        class="flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold leading-5 opacity-60"
      >
        <AppIcon name="file" class="h-5 w-5" />
        Export Excel
      </button>

      <router-link
        to="/admin/data-master/perusahaan/tambah"
        class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold leading-5 text-white hover:bg-blue-700"
      >
        <AppIcon name="plus" class="h-5 w-5" />
        Tambah Perusahaan
      </router-link>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Daftar Pengajuan" description="Status pengajuan tempat PKL siswa." />

        <div class="flex gap-8 overflow-x-auto border-b border-slate-200 px-6">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            :class="[
              'flex items-center gap-2 whitespace-nowrap border-b-2 py-3 text-sm font-semibold',
              tab.key === activeTab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900',
            ]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
            <span
              v-if="counts[tab.key] != null"
              :class="[
                'rounded-full px-2 py-0.5 text-[11px]',
                tab.key === activeTab ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600',
              ]"
            >
              {{ counts[tab.key] }}
            </span>
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-3 px-6 py-4">
          <label
            class="flex h-11 min-w-[240px] flex-1 items-center gap-3 rounded-xl bg-slate-100 px-4 opacity-70"
            title="Pencarian aktif setelah data dari BE tersedia"
          >
            <AppIcon name="search" class="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              disabled
              placeholder="Cari nama / NIS siswa…"
              class="min-w-0 flex-1 cursor-not-allowed bg-transparent text-xs outline-none placeholder:text-slate-400"
            />
            <span class="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium leading-[14px] text-slate-500">
              Ctrl K
            </span>
          </label>

          <span
            class="flex h-11 w-[220px] cursor-not-allowed items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 opacity-60"
            title="Menunggu data dari BE"
          >
            <span class="flex items-center gap-2">
              <AppIcon name="building" class="h-4 w-4 text-slate-400" />
              Semua Perusahaan
            </span>
            <AppIcon name="chevron-down" class="h-4 w-4" />
          </span>

          <span
            class="flex h-11 w-[200px] cursor-not-allowed items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 opacity-60"
            title="Menunggu data dari BE"
          >
            <span class="flex items-center gap-2">
              <AppIcon name="calendar" class="h-4 w-4 text-slate-400" />
              {{ bulanIni }}
            </span>
            <AppIcon name="chevron-down" class="h-4 w-4" />
          </span>

          <button
            type="button"
            disabled
            class="flex h-11 cursor-not-allowed items-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-600 opacity-60"
          >
            <AppIcon name="filter" class="h-4 w-4" />
            Terapkan
          </button>
        </div>

        <!-- Judul kolom -->
        <div class="flex items-center gap-4 border-t border-slate-100 bg-slate-100 px-6 py-2.5">
          <span class="flex-[2] text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Siswa</span>
          <span class="flex-[1.6] text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Perusahaan Tujuan</span>
          <span class="flex-1 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Diajukan</span>
          <span class="flex-1 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Status</span>
          <span class="w-[120px] text-right text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Aksi</span>
        </div>

        <ul v-if="rows.length">
          <li
            v-for="row in rows"
            :key="row.id"
            class="flex items-center gap-4 border-t border-slate-100 px-6 py-4 first:border-t-0"
          >
            <div class="flex flex-[2] items-center gap-3">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <AppIcon name="user" class="h-5 w-5" />
              </span>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold leading-5 text-slate-900">{{ row.siswa.nama }}</p>
                <p class="truncate text-xs leading-4 text-slate-500">NIS {{ row.siswa.nis }} · {{ row.siswa.kelas }}</p>
              </div>
            </div>

            <div class="min-w-0 flex-[1.6]">
              <p class="truncate text-sm font-semibold leading-5 text-slate-900">{{ row.perusahaan.nama }}</p>
              <p class="truncate text-xs leading-4 text-slate-500">{{ row.perusahaan.alamat }}</p>
            </div>

            <p class="flex-1 text-sm text-slate-600">{{ row.diajukan }}</p>

            <div class="flex-1">
              <span
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-[14px]',
                  statusMap[row.status]?.badge,
                ]"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                {{ statusMap[row.status]?.label }}
              </span>
            </div>

            <div class="flex w-[120px] justify-end">
              <button
                v-if="row.status === 'menunggu'"
                type="button"
                disabled
                title="Menunggu endpoint BE"
                class="flex h-9 cursor-not-allowed items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white opacity-60"
              >
                <AppIcon name="circle-check" class="h-4 w-4" />
                Verifikasi
              </button>
              <button
                v-else
                type="button"
                disabled
                title="Menunggu endpoint BE"
                class="flex h-9 cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold opacity-60"
              >
                <AppIcon name="eye" class="h-4 w-4" />
                Detail
              </button>
            </div>
          </li>
        </ul>

        <p v-else class="px-6 py-12 text-center text-sm text-slate-400">
          Data pengajuan belum tersedia. Menunggu endpoint dari BE.
        </p>

        <!-- Footer + pagination -->
        <div class="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 text-xs text-slate-600">
          <span>{{ summary }}</span>

          <div v-if="meta.lastPage > 1" class="flex items-center gap-1.5">
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"
              :disabled="meta.page === 1"
              aria-label="Halaman sebelumnya"
              @click="meta.page--"
            >
              <AppIcon name="arrow-left" class="h-4 w-4" />
            </button>

            <template v-for="(p, i) in pageNumbers" :key="i">
              <span v-if="p === '…'" class="flex h-8 w-8 items-center justify-center">…</span>
              <button
                v-else
                type="button"
                :class="[
                  'h-8 min-w-8 rounded-lg px-2 text-xs font-semibold',
                  p === meta.page ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
                ]"
                @click="meta.page = p"
              >
                {{ p }}
              </button>
            </template>

            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"
              :disabled="meta.page === meta.lastPage"
              aria-label="Halaman berikutnya"
              @click="meta.page++"
            >
              <AppIcon name="arrow-right" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'

const stats = [
  { label: 'Menunggu Verifikasi', icon: 'hourglass', tone: 'amber', value: null, hint: 'perlu ditinjau admin' },
  { label: 'Diterima', icon: 'circle-check', tone: 'green', value: null, hint: 'langsung jadi penempatan' },
  { label: 'Ditolak', icon: 'circle-x', tone: 'red', value: null, hint: 'siswa memilih ulang' },
  { label: 'Perusahaan Dibuka', icon: 'building', tone: 'blue', value: null, hint: 'bisa dipilih siswa' },
]

const tabs = [
  { key: 'semua', label: 'Semua' },
  { key: 'menunggu', label: 'Menunggu' },
  { key: 'diterima', label: 'Diterima' },
  { key: 'ditolak', label: 'Ditolak' },
]
const activeTab = ref('semua')

const counts = reactive({ semua: null, menunggu: null, diterima: null, ditolak: null })

const statusMap = {
  menunggu: { label: 'Menunggu', badge: 'border-yellow-200 bg-yellow-50 text-yellow-700' },
  diterima: { label: 'Diterima', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  ditolak: { label: 'Ditolak', badge: 'border-red-200 bg-red-50 text-red-700' },
}

const rows = ref([])
const meta = reactive({ page: 1, lastPage: 1, from: 0, to: 0, total: 0 })

const bulanIni = new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })

const summary = computed(() =>
  meta.total === 0
    ? 'Tidak ada pengajuan'
    : `Menampilkan ${meta.from}–${meta.to} dari ${meta.total} pengajuan`
)

const pageNumbers = computed(() => {
  const total = meta.lastPage
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)

  const wanted = [1, total, meta.page - 1, meta.page, meta.page + 1]
  const list = [...new Set(wanted)].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)

  const result = []
  list.forEach((n, i) => {
    if (i > 0 && n - list[i - 1] > 1) result.push('…')
    result.push(n)
  })
  return result
})
</script>