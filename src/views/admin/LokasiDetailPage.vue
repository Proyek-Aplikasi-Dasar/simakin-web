<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Lokasi & Penempatan', to: backTo }, { label: 'Detail Lokasi' }]"
      title="Detail Lokasi PKL"
      subtitle="Koordinat presensi, kuota, dan siswa yang ditempatkan."
    >
      <router-link
        :to="backTo"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </router-link>
      <router-link
        :to="`/admin/data-master/perusahaan/${id}/edit`"
        class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <AppIcon name="pencil" class="h-5 w-5" />
        Edit Lokasi
      </router-link>
    </PageHeader>

    <p v-if="loading" class="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-400">
      Memuat data...
    </p>
    <div v-else-if="loadError" class="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-8 text-center">
      <p class="text-sm text-red-600">{{ loadError }}</p>
      <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">
        Coba lagi
      </button>
    </div>

    <div v-else class="flex flex-col gap-6">
      <section class="relative overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div class="absolute inset-x-0 top-0 h-14 overflow-hidden bg-blue-600">
          <span class="absolute -top-[90px] left-[900px] h-[180px] w-[180px] rounded-full bg-blue-700"></span>
          <span class="absolute left-[1010px] top-2.5 h-[120px] w-[120px] rounded-full bg-blue-700"></span>
        </div>

        <div class="relative flex items-end gap-6 px-6 pb-5 pt-7">
          <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white p-1">
            <div class="flex h-full w-full items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <AppIcon name="building" class="h-9 w-9" />
            </div>
          </div>

          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <h2 class="truncate text-lg font-semibold leading-[26px] text-slate-900">{{ data.nama }}</h2>
            <p class="text-xs leading-[18px] text-slate-500">{{ data.alamat || '—' }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 border-t border-slate-100 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem icon="user" label="Pimpinan" :value="data.pimpinan" />
          <InfoItem icon="user-check" label="Guru Pembimbing" :value="guruText" />
          <InfoItem icon="briefcase" label="Kuota" :value="kuotaText" />
          <InfoItem icon="calendar" label="Gelombang" :value="gelombangText" />
        </div>
      </section>

      <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div class="flex flex-col gap-6">
          <FormCard title="Lokasi" description="Lokasi perusahaan di peta.">
            <template #action>
              <router-link :to="`/admin/data-master/perusahaan/${id}/edit`" class="text-xs font-semibold text-blue-600 hover:underline">
                Ubah Titik
              </router-link>
            </template>

            <div class="flex flex-col gap-4">
              <div v-if="point" class="h-[260px]">
                <MapView :latitude="point.lat" :longitude="point.lng" />
              </div>
              <div v-else class="flex h-[260px] items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500">
                Koordinat belum diisi untuk perusahaan ini
              </div>
              <InfoItem icon="crosshair" label="Koordinat" :value="koordinat" />
              <a
                v-if="mapsUrl"
                :href="mapsUrl"
                target="_blank"
                rel="noopener"
                class="text-xs font-semibold text-blue-600 hover:underline"
              >
                Buka di Google Maps
              </a>
            </div>
          </FormCard>

          <FormCard title="Siswa Ditempatkan" description="Penempatan siswa di lokasi ini beserta statusnya.">
            <template #action>
              <router-link
                :to="`/admin/lokasi-penempatan/tambah?perusahaan_id=${id}`"
                class="text-xs font-semibold text-blue-600 hover:underline"
              >
                Tambah Siswa
              </router-link>
            </template>

            <div class="-mx-6 -mb-6 -mt-5 overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-slate-100">
                  <tr>
                    <th
                      v-for="h in ['Siswa', 'Guru', 'Gelombang', 'Status']"
                      :key="h"
                      class="px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.6px] text-slate-500"
                    >
                      {{ h }}
                    </th>
                    <th class="px-6 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.6px] text-slate-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!penempatan.length">
                    <td colspan="5" class="px-6 py-10 text-center text-xs text-slate-400">
                      Belum ada siswa yang ditempatkan di lokasi ini.
                    </td>
                  </tr>
                  <tr v-for="row in penempatan" :key="row.id" class="border-t border-slate-100">
                    <td class="px-6 py-3">
                      <p class="text-xs font-semibold text-slate-900">{{ row.siswa?.nama ?? '—' }}</p>
                      <p class="text-[11px] text-slate-500">NIS {{ row.siswa?.nis ?? '—' }}</p>
                    </td>
                    <td class="px-6 py-3 text-xs text-slate-600">{{ row.guru?.nama ?? '—' }}</td>
                    <td class="px-6 py-3 text-xs text-slate-600">{{ row.gelombang?.nama ?? '—' }}</td>
                    <td class="px-6 py-3">
                      <span
                        :class="['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', LOKASI_BADGE[row.status].box]"
                      >
                        <span :class="['h-1.5 w-1.5 rounded-full', LOKASI_BADGE[row.status].dot]" />
                        {{ LOKASI_BADGE[row.status].label }}
                      </span>
                    </td>
                    <td class="px-6 py-3">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          v-for="n in LOKASI_NEXT[row.status]"
                          :key="n.status"
                          type="button"
                          :disabled="busyId === row.id"
                          :class="[
                            'rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50',
                            n.status === 'cancelled' ? 'text-red-600 hover:bg-red-50' : 'text-blue-600 hover:bg-blue-50',
                          ]"
                          @click="onAction(row, n)"
                        >
                          {{ n.status === 'cancelled' && confirmCancelId === row.id ? 'Yakin batalkan?' : n.label }}
                        </button>
                        <router-link
                          :to="`/admin/lokasi-penempatan/penempatan/${row.id}/edit`"
                          class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                          aria-label="Edit penempatan"
                          title="Edit penempatan"
                        >
                          <AppIcon name="pencil" class="h-4 w-4" />
                        </router-link>
                        <button
                          type="button"
                          class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600"
                          aria-label="Hapus penempatan"
                          title="Hapus penempatan"
                          @click="toDelete = row"
                        >
                          <AppIcon name="trash" class="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </FormCard>
        </div>

        <div class="flex flex-col gap-6">
          <FormCard title="Ringkasan Penempatan" description="Jumlah penempatan berdasarkan status.">
            <ul class="flex flex-col gap-3 text-sm">
              <li v-for="r in ringkasan" :key="r.label" class="flex items-center justify-between">
                <span class="flex items-center gap-2.5 text-slate-600">
                  <span :class="['h-2 w-2 rounded-full', r.dot]"></span>
                  {{ r.label }}
                </span>
                <span class="font-semibold text-slate-900">{{ r.count }}</span>
              </li>
            </ul>
            <p class="mt-4 text-[11px] text-slate-400">
              Data presensi per lokasi belum tersedia di BE.
            </p>
          </FormCard>

          <FormCard title="Kontak Perusahaan">
            <div class="flex flex-col gap-4">
              <InfoItem icon="smartphone" label="Telepon" :value="data.telp" />
              <InfoItem icon="mail" label="Email" :value="data.email" />
            </div>
          </FormCard>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :show="!!toDelete"
      title="Hapus penempatan?"
      :message="`Penempatan ${toDelete?.siswa?.nama ?? ''} di lokasi ini akan dihapus.`"
      :loading="deleting"
      @cancel="toDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import InfoItem from '../../components/InfoItem.vue'
import AppIcon from '../../components/AppIcon.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import MapView from '../../components/MapView.vue'
import api, { getErrorMessage } from '../../services/api'
import { fetchAllPages } from '../../utils/siswa'
import { LOKASI_BADGE, LOKASI_NEXT, MEMAKAI_KUOTA, terisiOf } from '../../utils/lokasi'
import { useToastStore } from '../../stores/toast'

const props = defineProps({
  id: { type: String, required: true },
})

const toast = useToastStore()
const backTo = '/admin/lokasi-penempatan'

const loading = ref(true)
const loadError = ref('')
const data = ref({})
const penempatan = ref([])

const busyId = ref(null)
const confirmCancelId = ref(null)
let cancelTimer = null

const toDelete = ref(null)
const deleting = ref(false)

const aktifList = computed(() => penempatan.value.filter((l) => MEMAKAI_KUOTA.includes(l.status)))

const kuotaText = computed(() => {
  const terisi = terisiOf(penempatan.value)
  return data.value.kuota != null ? `${terisi} / ${data.value.kuota} siswa` : `${terisi} siswa (tanpa batas)`
})

const guruText = computed(() => [...new Set(aktifList.value.map((l) => l.guru?.nama).filter(Boolean))].join(', '))

const gelombangText = computed(() =>
  [...new Set(aktifList.value.map((l) => l.gelombang && `${l.gelombang.nama} ${l.gelombang.tahun_ajaran}`).filter(Boolean))].join(', ')
)

const ringkasan = computed(() =>
  Object.entries(LOKASI_BADGE).map(([status, b]) => ({
    label: b.label,
    dot: b.dot,
    count: penempatan.value.filter((l) => l.status === status).length,
  }))
)

const koordinat = computed(() => {
  const { latitude, longitude } = data.value
  if (latitude == null || longitude == null) return ''
  return `${Number(latitude)}, ${Number(longitude)}`
})

const mapsUrl = computed(() =>
  koordinat.value ? `https://www.google.com/maps?q=${encodeURIComponent(koordinat.value)}` : ''
)

const point = computed(() => {
  const { latitude, longitude } = data.value
  if (latitude == null || longitude == null) return null
  const lat = Number(latitude)
  const lng = Number(longitude)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
})

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [p, l] = await Promise.all([
      api.get(`/api/perusahaan/${props.id}`),
      fetchAllPages('/api/lokasi-pkl', { perusahaan_id: props.id }),
    ])
    data.value = p.data.data
    penempatan.value = l
  } catch (err) {
    loadError.value =
      err.response?.status === 404 ? 'Lokasi tidak ditemukan.' : getErrorMessage(err, 'Gagal memuat data.')
  } finally {
    loading.value = false
  }
}

function onAction(row, next) {
  if (next.status === 'cancelled' && confirmCancelId.value !== row.id) {
    confirmCancelId.value = row.id
    clearTimeout(cancelTimer)
    cancelTimer = setTimeout(() => (confirmCancelId.value = null), 4000)
    return
  }
  changeStatus(row, next.status)
}

async function changeStatus(row, status) {
  if (busyId.value) return
  busyId.value = row.id
  try {
    const { data: res } = await api.put(`/api/lokasi-pkl/${row.id}/status`, { status })
    penempatan.value = penempatan.value.map((l) => (l.id === row.id ? res.data : l))
    toast.show(res.message || 'Status penempatan diperbarui.')
  } catch (err) {
    toast.show(getErrorMessage(err, 'Gagal mengubah status.'), 'error')
  } finally {
    busyId.value = null
    confirmCancelId.value = null
  }
}

async function confirmDelete() {
  const target = toDelete.value
  if (!target || deleting.value) return
  deleting.value = true
  try {
    const { data: res } = await api.delete(`/api/lokasi-pkl/${target.id}`)
    penempatan.value = penempatan.value.filter((l) => l.id !== target.id)
    toast.show(res.message || 'Penempatan dihapus.')
  } catch (err) {
    toast.show(getErrorMessage(err, 'Gagal menghapus penempatan.'), 'error')
  } finally {
    deleting.value = false
    toDelete.value = null
  }
}

onMounted(load)
onBeforeUnmount(() => clearTimeout(cancelTimer))
</script>