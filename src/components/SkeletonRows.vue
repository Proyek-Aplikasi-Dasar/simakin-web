<template>
  <div class="divide-y divide-slate-100" role="status" aria-busy="true" aria-label="Memuat data">
    <div v-for="i in rows" :key="i" class="flex items-center gap-4 px-6 py-3">
      <span v-if="avatar" class="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200"></span>

      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <span class="h-3 w-44 max-w-full animate-pulse rounded bg-slate-200"></span>
        <span class="h-2.5 w-28 max-w-full animate-pulse rounded bg-slate-100"></span>
      </div>

      <span
        v-for="n in cols"
        :key="n"
        class="hidden h-3 w-24 shrink-0 animate-pulse rounded bg-slate-200 md:block"
      ></span>

      <span v-if="action" class="hidden h-9 w-24 shrink-0 animate-pulse rounded-xl bg-slate-100 md:block"></span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rows: { type: Number, default: 6 },
  cols: { type: Number, default: 3 },
  avatar: { type: Boolean, default: true },
  action: { type: Boolean, default: true },
})
</script>
