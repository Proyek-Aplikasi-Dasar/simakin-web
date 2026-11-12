<template>
  <div ref="root" class="relative w-[360px] max-w-full">
    <label
      class="flex h-10 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-100 px-3 focus-within:border-blue-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100"
    >
      <AppIcon name="search" class="h-5 w-5 shrink-0 text-slate-400" />
      <input
        ref="input"
        v-model="q"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-label="Pencarian global"
        aria-controls="global-search-list"
        :aria-expanded="panelOpen"
        :aria-activedescendant="active >= 0 ? `gs-opt-${active}` : undefined"
        placeholder="Cari siswa, perusahaan, menu…"
        class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        @focus="open = true"
        @keydown="onKeydown"
      />
      <span class="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium leading-[14px] text-slate-500">
        Ctrl K
      </span>
    </label>

    <div
      v-if="panelOpen"
      id="global-search-list"
      role="listbox"
      class="absolute left-0 top-12 z-30 max-h-[420px] w-[420px] max-w-[90vw] overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-lg"
    >
      <p v-if="!term" class="px-4 py-3 text-xs text-slate-500">Ketik untuk mencari menu, siswa (nama / NIS), atau perusahaan.</p>

      <template v-else>
        <template v-for="s in sections" :key="s.title">
          <template v-if="s.items.length || s.loading || s.failed">
            <p class="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">{{ s.title }}</p>

            <button
              v-for="it in s.items"
              :id="`gs-opt-${it.idx}`"
              :key="it.key"
              type="button"
              role="option"
              :aria-selected="active === it.idx"
              :class="['flex w-full items-center gap-3 px-4 py-2 text-left', active === it.idx ? 'bg-blue-50' : 'hover:bg-slate-50']"
              @mousemove="active = it.idx"
              @click="pilih(it)"
            >
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <AppIcon :name="it.icon" class="h-4 w-4" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-xs font-semibold leading-[18px] text-slate-900">{{ it.label }}</span>
                <span v-if="it.sub" class="block truncate text-[11px] leading-[14px] text-slate-500">{{ it.sub }}</span>
              </span>
            </button>

            <p v-if="s.loading && !s.items.length" class="px-4 py-2 text-xs text-slate-400">Mencari…</p>
            <p v-else-if="s.failed" class="px-4 py-2 text-xs text-red-600">Gagal memuat {{ s.title.toLowerCase() }}.</p>
          </template>
        </template>

        <p v-if="kosong" class="px-4 py-6 text-center text-xs text-slate-400">Tidak ada hasil untuk “{{ term }}”.</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  menuItems: { type: Array, default: () => [] },
})

const MIN_CHARS = 2
const LIMIT = 5

const router = useRouter()
const root = ref(null)
const input = ref(null)

const q = ref('')
const open = ref(false)
const active = ref(-1)

const siswa = ref([])
const perusahaan = ref([])
const loading = ref(false)
const failed = reactive({ siswa: false, perusahaan: false })

const term = computed(() => q.value.trim())
const panelOpen = computed(() => open.value)

const menuHits = computed(() => {
  const t = term.value.toLowerCase()
  if (!t) return []
  return props.menuItems
    .filter((m) => `${m.label} ${m.group ?? ''}`.toLowerCase().includes(t))
    .slice(0, LIMIT)
    .map((m) => ({ key: `m-${m.to}`, icon: m.icon || 'dashboard', label: m.label, sub: m.group, to: m.to }))
})

const sections = computed(() => {
  let i = 0
  const withIdx = (items) => items.map((it) => ({ ...it, idx: i++ }))
  return [
    { title: 'Menu', items: withIdx(menuHits.value) },
    { title: 'Siswa', items: withIdx(siswa.value), loading: loading.value, failed: failed.siswa },
    { title: 'Perusahaan', items: withIdx(perusahaan.value), loading: loading.value, failed: failed.perusahaan },
  ]
})

const flat = computed(() => sections.value.flatMap((s) => s.items))
const kosong = computed(
  () => term.value && !loading.value && !flat.value.length && !failed.siswa && !failed.perusahaan
)

let timer = null
let seq = 0

async function cari(t) {
  const mine = ++seq
  loading.value = true
  failed.siswa = failed.perusahaan = false

  const [s, p] = await Promise.allSettled([
    api.get('/api/siswa', { params: { search: t } }),
    api.get('/api/perusahaan', { params: { search: t } }),
  ])
  if (mine !== seq) return 

  if (s.status === 'fulfilled') {
    siswa.value = (s.value.data.data ?? []).slice(0, LIMIT).map((r) => ({
      key: `s-${r.id}`,
      icon: 'user',
      label: r.user?.name ?? `Siswa ${r.nis}`,
      sub: ['NIS ' + r.nis, r.kelas, r.jurusan?.kode].filter(Boolean).join(' · '),
      to: `/admin/master-data/siswa/${r.id}`,
    }))
  } else {
    siswa.value = []
    failed.siswa = true
  }

  if (p.status === 'fulfilled') {
    perusahaan.value = (p.value.data.data ?? []).slice(0, LIMIT).map((r) => ({
      key: `p-${r.id}`,
      icon: 'building',
      label: r.nama,
      sub: r.alamat,
      to: `/admin/data-master/perusahaan/${r.id}`,
    }))
  } else {
    perusahaan.value = []
    failed.perusahaan = true
  }

  loading.value = false
}

watch(q, () => {
  clearTimeout(timer)
  active.value = -1
  const t = term.value
  if (t.length < MIN_CHARS) {
    seq++ 
    siswa.value = []
    perusahaan.value = []
    loading.value = false
    failed.siswa = failed.perusahaan = false
    return
  }
  loading.value = true
  timer = setTimeout(() => cari(t), 300)
})

watch(flat, (list) => {
  if (active.value >= list.length) active.value = list.length ? 0 : -1
  if (active.value < 0 && list.length) active.value = 0
})

function tutup() {
  open.value = false
  active.value = -1
}

function pilih(it) {
  router.push(it.to)
  q.value = ''
  tutup()
  input.value?.blur()
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    if (q.value) q.value = ''
    else {
      tutup()
      input.value?.blur()
    }
    return
  }
  if (!flat.value.length) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    open.value = true
    active.value = (active.value + 1) % flat.value.length
    scrollKeAktif()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    active.value = (active.value - 1 + flat.value.length) % flat.value.length
    scrollKeAktif()
  } else if (e.key === 'Enter' && active.value >= 0) {
    e.preventDefault()
    pilih(flat.value[active.value])
  }
}

function scrollKeAktif() {
  requestAnimationFrame(() => document.getElementById(`gs-opt-${active.value}`)?.scrollIntoView({ block: 'nearest' }))
}

function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) tutup()
}

// Ctrl K: halaman yang punya pencarian sendiri sudah memanggil preventDefault(), maka dilewati
function onShortcut(e) {
  if (e.defaultPrevented) return
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    input.value?.focus()
    input.value?.select()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocClick)
  window.addEventListener('keydown', onShortcut)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  document.removeEventListener('mousedown', onDocClick)
  window.removeEventListener('keydown', onShortcut)
})
</script>
