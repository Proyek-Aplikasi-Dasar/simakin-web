<template>
  <div class="flex items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
    <div class="flex min-w-0 flex-col gap-0.5">
      <h2 class="text-base font-semibold leading-6 tracking-[-0.02em] text-slate-900">{{ title }}</h2>
      <p v-if="description" class="text-xs leading-[18px] text-slate-500">{{ description }}</p>
    </div>

    <router-link
      v-if="action && to"
      :to="to"
      class="shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold leading-4 text-blue-600 hover:bg-blue-50"
    >
      {{ action }}
    </router-link>
    <span
      v-else-if="action"
      class="shrink-0 cursor-not-allowed whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold leading-4 text-blue-600 opacity-50"
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
  to: { type: [String, Object], default: null },
})
</script>