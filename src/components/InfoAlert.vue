<template>
  <div class="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
    <AppIcon :name="icon" class="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
    <div class="min-w-0">
      <p class="text-xs font-semibold leading-[18px] text-slate-900">{{ title }}</p>
      <p v-if="text" class="text-[11px] leading-[14px] text-slate-600">{{ text }}</p>
    </div>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  icon: { type: String, default: 'key-round' },
  title: { type: String, required: true },
  text: { type: String, default: '' },
})
</script>