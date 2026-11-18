<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Guru Pembimbing', to: backTo }, { label: 'Detail Guru' }]"
      title="Detail Guru"
      subtitle="Identitas guru pembimbing dan siswa yang dibimbing."
    >
      <router-link
        :to="backTo"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </router-link>
      <router-link
        :to="`${backTo}/${id}/edit`"
        class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <AppIcon name="pencil" class="h-4 w-4" />
        Edit Data
      </router-link>
    </PageHeader>

    <PageSkeleton v-if="loading" />
    <div v-else-if="error" class="flex flex-col items-center gap-3 py-16 text-center">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">
        Coba lagi
      </button>
    </div>

    <div v-else class="flex flex-col gap-6">
      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div class="h-[86px] bg-blue-600"></div>
        <div class="flex items-end justify-between gap-4 px-6 pb-5">
          <div class="flex items-end gap-5">
            <span class="-mt-10 flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-blue-600">
              <AppIcon name="user" class="h-10 w-10" />
            </span>
            <div class="flex flex-col gap-1 pb-1">
              <h2 class="text-xl font-bold leading-7 text-slate-900">{{ guru.user?.name ?? '—' }}</h2>
              <p class="text-xs text-slate-500">NIP {{ guru.nip }} · Guru Pembimbing</p>
            </div>
          </div>
          <span
            :class="[
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4',
              aktif.length ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-yellow-200 bg-yellow-50 text-yellow-700',
            ]"
          >
            <span :class="['h-1.5 w-1.5 rounded-full', aktif.length ? 'bg-emerald-700' : 'bg-yellow-700']" />
            {{ aktif.length ? 'Aktif Membimbing' : 'Belum Ada Siswa' }}
          </span>
        </div>
        <div class="grid grid-cols-1 gap-5 border-t border-slate-100 px-6 py-5 md:grid-cols-3">
          <InfoItem icon="smartphone" label="Nomor Telepon" :value="guru.telp" />
          <InfoItem icon="building" label="Program Studi" :value="prodi" />
          <InfoItem icon="key-round" label="Akun" :value="guru.user?.username" />
          <InfoItem v-if="guru.alamat" class="md:col-span-3" icon="pin" label="Alamat" :value="guru.alamat" />
        </div>
      </section>

      <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="s in stats" :key="s.label" v-bind="s" />
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader title="Siswa Bimbingan" description="Siswa yang dialokasikan ke guru ini.">
          <template #action>
            <router-link to="/admin/lokasi-penempatan" class="text-xs font-semibold text-blue-600 hover:underline">
              Tambah Siswa
            </router-link>
          </template>
        </CardHeader>

        <div class="flex items-center gap-4 border-t border-slate-100 bg-slate-100 px-6 py-2.5">
          <span
            v-for="col in columns"
            :key="col.label"
            :class="[col.width, col.align, 'text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500']"
          >
            {{ col.label }}
          </span>
        </div>

        <p v-if="!rows.length" class="px-6 py-12 text-center text-sm text-slate-400">Belum ada siswa yang dialokasikan.</p>

        <div v-else class="divide-y divide-slate-100">
          <div v-for="r in pagedRows" :key="r.id" class="flex items-center gap-4 px-6 py-3">
            <div class="flex min-w-0 flex-1 items-center gap-2.5">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <AppIcon name="user" class="h-5 w-5" />
              </span>
              <div class="flex min-w-0 flex-col">
                <span class="truncate text-xs font-semibold leading-[18px] text-slate-900">{{ r.nama }}</span>
                <span class="truncate text-[11px] leading-[14px] text-slate-500">
                  NIS {{ r.nis }}<template v-if="r.kelas"> · {{ r.kelas }}</template>
                </span>
              </div>
            </div>
            <span class="w-[220px] truncate text-xs text-slate-600">{{ r.perusahaan }}</span>
            <div class="flex w-[170px] flex-col gap-1.5">
              <template v-if="r.persen !== null">
                <span class="text-xs font-medium leading-[18px] text-slate-900">{{ r.persen }}% hadir</span>
                <div class="h-1.5 w-[120px] overflow-hidden rounded-full bg-slate-200">
                  <div
                    :class="['h-full rounded-full', r.persen >= 80 ? 'bg-emerald-700' : 'bg-red-700']"
                    :style="{ width: `${r.persen}%` }"
                  />
                </div>
              </template>
              <span v-else class="text-xs text-slate-400">—</span>
            </div>
            <div class="w-[130px]">
              <span :class="['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', r.box]">
                <span :class="['h-1.5 w-1.5 rounded-full', r.dot]" />
                {{ r.statusLabel }}
              </span>
            </div>
            <div class="flex w-[96px] justify-end gap-2">
              <router-link
                :to="`/admin/master-data/siswa/${r.siswaId}`"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Lihat siswa"
                title="Lihat siswa"
              >
                <AppIcon name="eye" class="h-5 w-5" />
              </router-link>
              <button
                v-if="r.canLepas"
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600"
                aria-label="Lepas dari guru ini"
                title="Lepas dari guru ini"
                @click="toLepas = r"
              >
                <AppIcon name="user-minus" class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <DataPagination
          v-model:page="page"
          :last-page="lastPage"
          :total="rows.length"
          :from="from"
          :to="to"
          item-label="penempatan"
        />
      </section>
    </div>

    <ConfirmDialog
      :show="!!toLepas"
      title="Lepas siswa dari guru ini?"
      :message="`${toLepas?.nama ?? 'Siswa'} tidak lagi dibimbing guru ini. Penempatan PKL-nya tetap ada dan guru bisa diatur ulang di menu Lokasi & Penempatan.`"
      :loading="lepasing"
      @cancel="toLepas = null"
      @confirm="confirmLepas"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api, { getErrorMessage } from '../../services/api'
import { fetchAllPages, LOKASI_STATUS } from '../../utils/siswa'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import StatCard from '../../components/StatCard.vue'
import InfoItem from '../../components/InfoItem.vue'
import AppIcon from '../../components/AppIcon.vue'
import PageSkeleton from '../../components/PageSkeleton.vue'
import DataPagination from '../../components/DataPagination.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { useToastStore } from '../../stores/toast'

const props = defineProps({ id: { type: String, required: true } })
const backTo = '/admin/master-data/guru'
const PAGE_SIZE = 4
const toast = useToastStore()

const columns = [
  { label: 'Siswa', width: 'flex-1', align: '' },
  { label: 'Tempat PKL', width: 'w-[220px]', align: '' },
  { label: 'Kehadiran', width: 'w-[170px]', align: '' },
  { label: 'Status', width: 'w-[130px]', align: '' },
  { label: 'Aksi', width: 'w-[96px]', align: 'text-right' },
]

const STYLE = {
  active: ['border-emerald-200 bg-emerald-50 text-emerald-700', 'bg-emerald-700'],
  pending: ['border-yellow-200 bg-yellow-50 text-yellow-700', 'bg-yellow-700'],
  completed: ['border-blue-200 bg-blue-50 text-blue-700', 'bg-blue-700'],
  cancelled: ['border-slate-200 bg-slate-100 text-slate-600', 'bg-slate-600'],
}

const loading = ref(true)
const error = ref('')
const guru = ref({})
const lokasi = ref([])
const siswaMap = ref(new Map())
const jurusanById = ref(new Map())
const rekap = ref(new Map())
const page = ref(1)
const toLepas = ref(null)
const lepasing = ref(false)

const aktif = computed(() => lokasi.value.filter((l) => l.status === 'active'))

function persenOf(siswaId) {
  const r = rekap.value.get(siswaId)
  if (!r) return null
  const efektif = r.total - r.libur
  return efektif > 0 ? Math.round((r.hadir / efektif) * 100) : null
}

const rows = computed(() =>
  [...lokasi.value]
    .filter((l) => l.status !== 'cancelled')
    .sort((a, b) => (a.status === 'active' ? -1 : 1) - (b.status === 'active' ? -1 : 1) || b.id - a.id)
    .map((l) => {
      const s = siswaMap.value.get(l.siswa?.id)
      const [box, dot] = STYLE[l.status] ?? STYLE.cancelled
      return {
        id: l.id,
        siswaId: l.siswa?.id,
        nama: l.siswa?.nama ?? '—',
        nis: l.siswa?.nis ?? '—',
        kelas: s?.kelas ?? '',
        perusahaan: l.perusahaan?.nama ?? '—',
        persen: persenOf(l.siswa?.id),
        canLepas: l.status === 'active' || l.status === 'pending',
        statusLabel: LOKASI_STATUS[l.status] ?? l.status,
        box,
        dot,
      }
    })
)

const lastPage = computed(() => Math.max(1, Math.ceil(rows.value.length / PAGE_SIZE)))
const pagedRows = computed(() => rows.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
const from = computed(() => (rows.value.length ? (page.value - 1) * PAGE_SIZE + 1 : 0))
const to = computed(() => Math.min(page.value * PAGE_SIZE, rows.value.length))

watch(lastPage, (n) => {
  if (page.value > n) page.value = n
})

const prodi = computed(() => guru.value.jurusan?.nama ?? jurusanById.value.get(guru.value.jurusan_id) ?? '')

const stats = computed(() => [
  {
    label: 'Siswa Bimbingan',
    icon: 'users',
    tone: 'blue',
    value: aktif.value.length,
    hint: guru.value.kuota_bimbingan != null ? `kuota ${guru.value.kuota_bimbingan} siswa` : 'siswa aktif PKL',
  },
  {
    label: 'Perusahaan',
    icon: 'building',
    tone: 'blue',
    value: new Set(aktif.value.map((l) => l.perusahaan?.id).filter(Boolean)).size,
    hint: 'lokasi PKL dipantau',
  },
  {
    label: 'Jurnal Siswa Bimbingan',
    icon: 'book-check',
    tone: 'green',
    value: null,
    emptyHint: 'PAD 2',
  },
  {
    label: 'Belum Mengisi Hari Ini',
    icon: 'hourglass',
    tone: 'amber',
    value: null,
    emptyHint: 'PAD 2',
  },
])

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [g, l, s, j, r] = await Promise.all([
      api.get(`/api/guru/${props.id}`),
      fetchAllPages('/api/lokasi-pkl', { guru_id: props.id }),
      fetchAllPages('/api/siswa'),
      fetchAllPages('/api/jurusan'),
      api.get('/api/absensi/rekap', { skipErrorToast: true }).catch(() => null),
    ])
    rekap.value = new Map((r?.data?.data ?? []).filter((x) => x.siswa?.id).map((x) => [x.siswa.id, x]))
    guru.value = g.data.data
    lokasi.value = l
    siswaMap.value = new Map(s.map((x) => [x.id, x]))
    jurusanById.value = new Map(j.map((x) => [x.id, x.nama]))
  } catch (e) {
    error.value = getErrorMessage(e, 'Gagal memuat data guru.')
  } finally {
    loading.value = false
  }
}

async function confirmLepas() {
  const target = toLepas.value
  if (!target || lepasing.value) return
  lepasing.value = true
  try {
    await api.put(`/api/lokasi-pkl/${target.id}`, { guru_id: null })
    toast.show(`${target.nama} tidak lagi dibimbing guru ini.`)
    lokasi.value = lokasi.value.filter((l) => l.id !== target.id)
  } catch (err) {
    const status = err.response?.status
    if (status && status < 500 && ![401, 403, 419, 429].includes(status)) {
      toast.show(getErrorMessage(err), 'error')
    }
  } finally {
    lepasing.value = false
    toLepas.value = null
  }
}

onMounted(load)
</script>