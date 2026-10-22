<template>
  <div class="mb-6 flex items-end justify-between gap-4">
    <div class="flex flex-col gap-1.5">
      <nav class="flex items-center gap-1.5 text-[11px] leading-[14px]" aria-label="Breadcrumb">
        <AppIcon name="home" class="h-3.5 w-3.5 text-slate-400" />
        <template v-for="(crumb, i) in breadcrumb" :key="i">
          <span class="text-slate-400">/</span>
          <span v-if="i === breadcrumb.length - 1" class="font-semibold text-blue-600">{{ crumb.label }}</span>
          <router-link v-else-if="crumb.to" :to="crumb.to" class="font-medium text-slate-500 hover:text-blue-600">
            {{ crumb.label }}
          </router-link>
          <span v-else class="font-medium text-slate-500">{{ crumb.label }}</span>
        </template>
      </nav>

      <h1 class="text-2xl font-bold leading-8 tracking-[-0.02em] text-slate-900">{{ title }}</h1>
      <p v-if="subtitle" class="text-sm leading-5 text-slate-600">{{ subtitle }}</p>
    </div>

    <!-- Tombol aksi di kanan -->
    <div class="flex shrink-0 items-center gap-3">
      <slot />
    </div>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  breadcrumb: { type: Array, default: () => [] }, // [{ label, to? }]
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>