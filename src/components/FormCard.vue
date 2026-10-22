<template>
  <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
    <div class="flex items-start justify-between gap-4 px-6 pt-6">
      <div>
        <h2 class="text-base font-semibold leading-6 tracking-[-0.02em] text-slate-900">{{ title }}</h2>
        <p v-if="description" class="mt-0.5 text-xs leading-[18px] text-slate-500">{{ description }}</p>
      </div>
      <slot name="action" />
    </div>

    <div class="px-6 pb-6 pt-5">
      <slot />
    </div>

    <div v-if="$slots.footer" class="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
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