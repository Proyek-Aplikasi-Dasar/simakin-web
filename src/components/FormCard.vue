<template>
  <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
    <div class="flex items-start justify-between gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
      <div class="min-w-0">
        <h2 class="text-base font-semibold leading-6 tracking-[-0.02em] text-slate-900">{{ title }}</h2>
        <p v-if="description" class="mt-0.5 text-xs leading-[18px] text-slate-500">{{ description }}</p>
      </div>
      <slot name="action" />
    </div>

    <div class="px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
      <slot />
    </div>

    <div v-if="$slots.footer" class="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 px-4 py-4 sm:px-6">
      <slot name="footer" />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>