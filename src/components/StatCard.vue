<template>
  <div
    class="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
  >
    <span :class="['flex h-11 w-11 items-center justify-center rounded-xl', tones[tone]]">
      <AppIcon :name="icon" class="h-5 w-5" />
    </span>

    <div class="flex flex-col gap-1">
      <p class="text-xs font-medium leading-[18px] text-slate-600">{{ label }}</p>

      <template v-if="showSkeleton">
        <span class="my-1.5 block h-[26px] w-20 animate-pulse rounded-md bg-slate-200"></span>
        <span class="block h-2.5 w-32 animate-pulse rounded bg-slate-100"></span>
      </template>
      <template v-else>
        <p class="text-[30px] font-bold leading-[38px] tracking-[-0.02em] text-slate-900">
          {{ hasValue ? value : '—' }}
        </p>
        <p class="text-[11px] leading-[14px] text-slate-500">{{ hasValue ? hint : 'Belum ada data' }}</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: null },
  hint: { type: String, default: '' },
  icon: { type: String, required: true },
  tone: { type: String, default: 'blue' },
  // true saat data sedang dimuat: tampilkan bayangan kosong, bukan "—"
  loading: { type: Boolean, default: false },
})

const hasValue = computed(() => props.value !== null && props.value !== undefined)
const showSkeleton = computed(() => props.loading && !hasValue.value)

const tones = {
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-yellow-50 text-yellow-700',
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
}
</script>