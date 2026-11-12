<template>
  <div class="flex items-start gap-3">
    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
      <AppIcon :name="icon" class="h-[18px] w-[18px]" />
    </span>
    <div class="flex min-w-0 flex-col gap-0.5">
      <p class="text-[10px] font-semibold uppercase leading-4 tracking-[0.06em] text-slate-500">{{ label }}</p>
      <p class="break-words text-xs font-semibold leading-[18px] text-slate-900">{{ value || '—' }}</p>
      <p v-if="hint" class="text-[11px] leading-[14px] text-slate-500">{{ hint }}</p>
    </div>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: [String, Number], default: '' },
  hint: { type: String, default: '' },
})
</script>