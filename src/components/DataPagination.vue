<template>
  <div class="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 text-xs leading-[18px] text-slate-500">
    <p aria-live="polite">
      <template v-if="total">
        Menampilkan {{ from }}–{{ to }} dari {{ total.toLocaleString('id-ID') }} {{ itemLabel }}
      </template>
      <template v-else>Tidak ada {{ itemLabel }}</template>
    </p>

    <nav v-if="lastPage > 1" aria-label="Paginasi" class="flex items-center gap-1.5">
      <button
        type="button"
        :disabled="page <= 1"
        aria-label="Halaman sebelumnya"
        class="flex h-8 w-8 items-center justify-center rounded-[10px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        @click="go(page - 1)"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
      </button>

      <template v-for="(p, i) in items" :key="`${p}-${i}`">
        <span v-if="p === '…'" aria-hidden="true" class="flex h-8 w-8 items-center justify-center text-xs font-semibold text-slate-500">…</span>
        <button
          v-else
          type="button"
          :aria-label="`Halaman ${p}`"
          :aria-current="p === page ? 'page' : undefined"
          :class="[
            'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold',
            p === page ? 'bg-blue-600 text-white' : 'border border-slate-100 bg-white text-slate-600 hover:bg-slate-50',
          ]"
          @click="go(p)"
        >
          {{ p }}
        </button>
      </template>

      <button
        type="button"
        :disabled="page >= lastPage"
        aria-label="Halaman berikutnya"
        class="flex h-8 w-8 items-center justify-center rounded-[10px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        @click="go(page + 1)"
      >
        <AppIcon name="arrow-right" class="h-4 w-4" />
      </button>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  page: { type: Number, required: true },
  lastPage: { type: Number, required: true },
  total: { type: Number, default: 0 },
  from: { type: Number, default: 0 },
  to: { type: Number, default: 0 },
  itemLabel: { type: String, default: 'data' },
})
const emit = defineEmits(['update:page'])

function go(n) {
  if (n >= 1 && n <= props.lastPage && n !== props.page) emit('update:page', n)
}

const items = computed(() => {
  const last = props.lastPage
  const cur = props.page
  const set = new Set([1, last, cur - 1, cur, cur + 1])
  if (cur <= 2) set.add(3)
  const sorted = [...set].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b)
  const out = []
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
})
</script>