<template>
  <div class="flex items-center justify-between gap-4 px-6 py-5">
    <div class="flex flex-col gap-0.5">
      <h2 class="text-base font-semibold leading-6 tracking-[-0.02em] text-slate-900">{{ title }}</h2>
      <p v-if="description" class="text-xs leading-[18px] text-slate-500">{{ description }}</p>
    </div>

    <span
      v-if="action"
      class="cursor-not-allowed rounded-xl px-3 py-1.5 text-xs font-semibold leading-4 text-blue-600 opacity-50"
      title="Segera hadir"
    >
      {{ action }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  action: { type: String, default: '' },
})
</script>