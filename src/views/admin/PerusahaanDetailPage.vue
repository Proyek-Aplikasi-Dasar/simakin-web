<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Data Master', to: backTo }, { label: 'Detail Perusahaan' }]"
      title="Detail Perusahaan"
      subtitle="Informasi lengkap perusahaan mitra PKL."
    >
      <router-link
        :to="backTo"
        class="flex h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-5 w-5 text-slate-600" />
        Kembali
      </router-link>
      <router-link
        :to="{ name: 'perusahaan-edit', params: { id } }"
        class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <AppIcon name="pencil" class="h-5 w-5" />
        Edit Data
      </router-link>
    </PageHeader>

    <p v-if="loading" class="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-400">
      Memuat data...
    </p>
    <p v-else-if="loadError" class="rounded-lg bg-red-50 p-3 text-xs text-red-600">{{ loadError }}</p>

    <div v-else class="flex flex-col gap-6">
      <!-- Ringkasan profil -->
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
          <InfoItem icon="smartphone" label="Nomor Telepon" :value="data.telp" />
          <InfoItem icon="mail" label="Email" :value="data.email" />
          <InfoItem icon="user" label="Pimpinan" :value="data.pimpinan" />
          <InfoItem icon="briefcase" label="Kuota Siswa" :value="data.kuota != null ? `${data.kuota} siswa` : ''" />
        </div>
      </section>

      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Siswa PKL Aktif" icon="users" tone="blue" :value="null" />
        <StatCard label="Total Alumni PKL" icon="cap" tone="blue" :value="null" />
        <StatCard label="Rata-rata Kehadiran" icon="calendar-check" tone="green" :value="null" />
        <StatCard
          label="Kuota"
          icon="briefcase"
          tone="amber"
          :value="data.kuota"
          hint="siswa per periode"
        />
      </div>

      <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <!-- Kolom utama -->
        <div class="flex flex-col gap-6">
          <FormCard title="Tentang Perusahaan">
            <p v-if="data.deskripsi" class="whitespace-pre-line text-sm leading-5 text-slate-600">
              {{ data.deskripsi }}
            </p>
            <p v-else class="text-sm text-slate-400">Belum ada deskripsi.</p>
          </FormCard>

          <FormCard title="Siswa PKL" description="Siswa yang ditempatkan di perusahaan ini.">
            <div class="-mx-6 -mb-6 -mt-5 overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-slate-100">
                  <tr>
                    <th
                      v-for="h in ['Siswa', 'Prodi', 'Pembimbing', 'Status']"
                      :key="h"
                      class="px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.6px] text-slate-500"
                    >
                      {{ h }}
                    </th>
                    <th class="w-16 px-6 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="5" class="px-6 py-10 text-center text-xs text-slate-400">
                      Belum ada data penempatan siswa.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </FormCard>
        </div>

        <!-- Kolom samping -->
        <div class="flex flex-col gap-6">
          <FormCard title="Lokasi" description="Lokasi perusahaan di peta.">
            <div class="flex flex-col gap-3">
              <div class="relative h-[200px] overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                <div
                  class="absolute inset-0"
                  style="
                    background-image: linear-gradient(#f1f5f9 1px, transparent 1px),
                      linear-gradient(90deg, #f1f5f9 1px, transparent 1px);
                    background-size: 48px 40px;
                  "
                ></div>
                <span class="absolute -left-6 top-[110px] h-3.5 w-[700px] rotate-[8deg] bg-white"></span>
                <span
                  class="absolute left-1/2 top-1/2 h-[132px] w-[132px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-blue-600 bg-blue-600/20"
                ></span>
                <span
                  class="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600 text-white"
                >
                  <AppIcon name="building" class="h-4 w-4" />
                </span>
              </div>

              <InfoItem icon="pin" label="Alamat" :value="data.alamat" />
              <InfoItem icon="crosshair" label="Koordinat" :value="koordinat" />
              <InfoItem icon="crosshair" label="Radius Presensi" value="" />

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

          <FormCard title="Bidang Pekerjaan">
            <p class="text-xs text-slate-400">Belum ada data bidang pekerjaan.</p>
          </FormCard>

          <FormCard title="Jurusan Diterima">
            <div v-if="data.jurusan?.length" class="flex flex-wrap gap-2">
              <span
                v-for="j in data.jurusan"
                :key="j.id"
                class="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-[3px] text-xs font-semibold text-blue-700"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-blue-700"></span>
                {{ j.nama }}
              </span>
            </div>
            <p v-else class="text-xs text-slate-400">Belum ada jurusan yang dipilih.</p>
          </FormCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import FormCard from '../../components/FormCard.vue'
import StatCard from '../../components/StatCard.vue'
import api, { getErrorMessage } from '../../services/api'

const props = defineProps({
  id: { type: String, required: true },
})

const backTo = { name: 'data-master', query: { tab: 'perusahaan' } }

const loading = ref(true)
const loadError = ref('')
const data = ref({})

const InfoItem = defineComponent({
  props: { icon: String, label: String, value: { type: [String, Number], default: '' } },
  setup(p) {
    return () =>
      h('div', { class: 'flex items-start gap-3' }, [
        h(
          'span',
          { class: 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400' },
          [h(AppIcon, { name: p.icon, class: 'h-[18px] w-[18px]' })]
        ),
        h('div', { class: 'min-w-0 flex flex-col gap-0.5' }, [
          h('p', { class: 'text-[10px] font-semibold uppercase leading-4 tracking-[0.06em] text-slate-500' }, p.label),
          h('p', { class: 'break-words text-xs font-semibold leading-[18px] text-slate-900' }, p.value || '—'),
        ]),
      ])
  },
})

const koordinat = computed(() => {
  const { latitude, longitude } = data.value
  if (latitude == null || longitude == null) return ''
  return `${Number(latitude)}, ${Number(longitude)}`
})

const mapsUrl = computed(() =>
  koordinat.value ? `https://www.google.com/maps?q=${encodeURIComponent(koordinat.value)}` : ''
)

onMounted(async () => {
  try {
    const res = await api.get(`/api/perusahaan/${props.id}`)
    data.value = res.data.data
  } catch (err) {
    loadError.value =
      err.response?.status === 404 ? 'Perusahaan tidak ditemukan.' : getErrorMessage(err, 'Gagal memuat data.')
  } finally {
    loading.value = false
  }
})
</script>