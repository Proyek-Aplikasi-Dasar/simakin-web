<template>
  <div
    class="flex flex-col gap-6 rounded-2xl border border-slate-100 bg-white p-6"
    role="status"
    aria-busy="true"
    aria-label="Memuat data"
  >
    <div class="flex items-center gap-4">
      <span class="h-14 w-14 shrink-0 animate-pulse rounded-full bg-slate-200"></span>
      <div class="flex flex-1 flex-col gap-2">
        <span class="h-4 w-56 max-w-full animate-pulse rounded bg-slate-200"></span>
        <span class="h-3 w-36 max-w-full animate-pulse rounded bg-slate-100"></span>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div v-for="n in blocks" :key="n" class="flex flex-col gap-2">
        <span class="h-3 w-24 animate-pulse rounded bg-slate-100"></span>
        <span class="h-10 w-full animate-pulse rounded-xl bg-slate-200"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  blocks: { type: Number, default: 4 },
})
</script>
