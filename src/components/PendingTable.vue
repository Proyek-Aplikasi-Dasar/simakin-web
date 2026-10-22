<template>
  <div>
    <div class="flex flex-wrap items-center gap-3 px-6 py-4">
      <label
        class="flex h-11 min-w-[240px] flex-1 items-center gap-3 rounded-xl bg-slate-100 px-4 opacity-70"
        title="Pencarian aktif setelah data dari BE tersedia"
      >
        <AppIcon name="search" class="h-4 w-4 shrink-0 text-slate-400" />
        <input
          type="text"
          disabled
          :placeholder="searchPlaceholder"
          class="min-w-0 flex-1 cursor-not-allowed bg-transparent text-xs outline-none placeholder:text-slate-400"
        />
      </label>

      <span
        v-for="f in filters"
        :key="f"
        class="flex h-11 w-[190px] cursor-not-allowed items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 opacity-60"
        title="Menunggu data dari BE"
      >
        {{ f }}
        <AppIcon name="chevron-down" class="h-4 w-4" />
      </span>

      <button
        type="button"
        disabled
        class="flex h-11 cursor-not-allowed items-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-600 opacity-60"
      >
        <AppIcon name="filter" class="h-4 w-4" />
        Terapkan
      </button>
    </div>

    <!-- Judul kolom -->
    <div class="flex items-center gap-4 border-t border-slate-100 bg-slate-100 px-6 py-2.5">
      <span
        v-for="(col, i) in columns"
        :key="col"
        :class="[
          i === 0 ? 'flex-[1.6]' : 'flex-1',
          'text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500',
        ]"
      >
        {{ col }}
      </span>
      <span class="w-[148px] text-right text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">
        Aksi
      </span>
    </div>

    <p class="px-6 py-12 text-center text-sm text-slate-400">
      Data {{ entity }} belum tersedia. Menunggu endpoint dari BE.
    </p>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  searchPlaceholder: { type: String, default: 'Cari...' },
  filters: { type: Array, default: () => [] },
  columns: { type: Array, required: true }, 
  entity: { type: String, required: true }, 
})
</script>