<template>
  <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
    <div class="relative h-14 overflow-hidden bg-blue-600">
      <span class="absolute -top-[90px] left-[900px] h-[180px] w-[180px] rounded-full bg-blue-700 max-xl:left-auto max-xl:right-0"></span>
      <span class="absolute left-[1010px] top-2.5 h-[120px] w-[120px] rounded-full bg-blue-700 max-xl:hidden"></span>
    </div>

    <div class="flex items-end gap-6 px-6 pb-5">
      <span class="-mt-7 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white p-1">
        <span class="flex h-full w-full items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <AppIcon name="user" class="h-9 w-9" />
        </span>
      </span>

      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <h2 class="truncate text-lg font-semibold leading-[26px] text-slate-900">{{ siswa?.nama || (loading ? 'Memuat…' : '—') }}</h2>
        <p class="truncate text-xs leading-[18px] text-slate-500">{{ meta }}</p>
      </div>

      <span
        v-if="statusLabel"
        :class="[
          'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4',
          statusTone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600',
        ]"
      >
        <span :class="['h-1.5 w-1.5 rounded-full', statusTone === 'success' ? 'bg-emerald-700' : 'bg-slate-500']" />
        {{ statusLabel }}
      </span>
    </div>

    <div class="grid grid-cols-1 gap-6 border-t border-slate-100 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
      <InfoItem icon="cap" label="Program Studi" :value="info?.programStudi" />
      <InfoItem icon="building" label="Tempat PKL" :value="info?.tempat" />
      <InfoItem icon="user" label="Pembimbing Industri" :value="info?.pembimbingIndustri" />
      <InfoItem icon="calendar" label="Periode PKL" :value="info?.periode" />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import InfoItem from './InfoItem.vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  siswa: { type: Object, default: null }, // { nama, nis, kelas }
  info: { type: Object, default: null }, // { programStudi, tempat, pembimbingIndustri, periode }
  statusLabel: { type: String, default: '' },
  statusTone: { type: String, default: 'neutral' }, // 'neutral' | 'success'
  loading: Boolean,
})

const meta = computed(() => {
  const s = props.siswa
  return s ? [s.nis ? `NIS ${s.nis}` : '', s.kelas].filter(Boolean).join(' · ') : ''
})
</script>
