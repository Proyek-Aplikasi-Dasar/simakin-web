<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
        @mousedown.self="onBackdrop"
      >
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="descId"
          tabindex="-1"
          class="w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-xl outline-none"
          @keydown="onKeydown"
        >
          <span class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <AppIcon name="circle-check" class="h-5 w-5" />
          </span>

          <h2 :id="titleId" class="mt-3 text-sm font-semibold text-slate-900">Setujui {{ count }} pengajuan?</h2>
          <p :id="descId" class="mt-1 text-xs leading-5 text-slate-600">
            Pilih guru pembimbing untuk semua penempatan hasil persetujuan ini.
          </p>

          <div class="mt-4">
            <label class="mb-1.5 block text-xs font-semibold leading-4 text-slate-900">Guru Pembimbing</label>

            <div
              v-if="guru"
              class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
            >
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold text-slate-900">{{ guru.none ? 'Tanpa pembimbing' : guruName(guru) }}</p>
                <p class="text-[11px] text-slate-500">
                  {{ guru.none ? 'Bisa diatur nanti lewat edit penempatan' : `NIP ${guru.nip ?? '—'}` }}
                </p>
              </div>
              <button
                type="button"
                :disabled="loading"
                class="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-60"
                @click="guru = null"
              >
                Ganti
              </button>
            </div>

            <template v-else>
              <label
                :class="[
                  'flex h-10 items-center gap-2 rounded-xl border bg-white px-3 focus-within:ring-2 focus-within:ring-blue-100',
                  showError ? 'border-red-300' : 'border-slate-200 focus-within:border-blue-600',
                ]"
              >
                <AppIcon name="search" class="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  ref="searchEl"
                  v-model="q"
                  type="text"
                  placeholder="Cari nama atau NIP guru…"
                  autocomplete="off"
                  class="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400"
                  @keydown.enter.prevent="filtered[0] && pick(filtered[0])"
                />
              </label>

              <ul class="mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1">
                <li class="border-b border-slate-100">
                  <button type="button" class="block w-full px-3 py-2 text-left hover:bg-slate-50" @click="pick(NONE)">
                    <span class="block text-xs font-semibold text-slate-900">Tanpa pembimbing</span>
                    <span class="block text-[11px] text-slate-500">Atur nanti lewat edit penempatan</span>
                  </button>
                </li>
                <li v-if="guruLoading" class="px-3 py-2 text-xs text-slate-400">Memuat daftar guru…</li>
                <li v-else-if="guruError" class="flex items-center gap-2 px-3 py-2 text-xs text-red-600">
                  {{ guruError }}
                  <button type="button" class="font-semibold underline" @click="loadGuru">Coba lagi</button>
                </li>
                <li v-else-if="!guruList.length" class="px-3 py-2 text-xs text-slate-400">Belum ada guru aktif.</li>
                <li v-else-if="!filtered.length" class="px-3 py-2 text-xs text-slate-400">Guru tidak ditemukan.</li>
                <li v-for="g in filtered" :key="g.id">
                  <button type="button" class="block w-full px-3 py-2 text-left hover:bg-slate-50" @click="pick(g)">
                    <span class="block text-xs font-semibold text-slate-900">{{ guruName(g) }}</span>
                    <span class="block text-[11px] text-slate-500">NIP {{ g.nip ?? '—' }}</span>
                  </button>
                </li>
              </ul>
            </template>

            <p v-if="showError" role="alert" class="mt-1 text-xs text-red-600">
              Pilih guru pembimbing, atau pilih “Tanpa pembimbing”.
            </p>
          </div>

          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              :disabled="loading"
              class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
              @click="emit('cancel')"
            >
              Batal
            </button>
            <button
              type="button"
              :disabled="loading"
              class="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              @click="submit"
            >
              <AppIcon name="circle-check" class="h-4 w-4" />
              {{ loading ? 'Memproses...' : 'Setujui' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, useId } from 'vue'
import AppIcon from './AppIcon.vue'
import { useDialog } from '../composables/useDialog'
import { getErrorMessage } from '../services/api'
import { fetchAllPages } from '../utils/siswa'

const props = defineProps({
  show: Boolean,
  count: { type: Number, default: 0 },
  loading: Boolean,
})
const emit = defineEmits(['cancel', 'confirm'])

const panel = ref(null)
const searchEl = ref(null)
const titleId = useId()
const descId = useId()

const NONE = { id: null, none: true }
const guru = ref(null)
const q = ref('')
const showError = ref(false)

const guruList = ref([])
const guruLoading = ref(false)
const guruError = ref('')
let guruLoaded = false

const guruName = (g) => g.user?.name ?? `Guru #${g.id}`

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return guruList.value
  return guruList.value.filter((g) => `${guruName(g)} ${g.nip ?? ''}`.toLowerCase().includes(term))
})

async function loadGuru() {
  guruLoading.value = true
  guruError.value = ''
  try {
    const all = await fetchAllPages('/api/guru')
    guruList.value = all
      .filter((g) => g.is_active !== false)
      .sort((a, b) => guruName(a).localeCompare(guruName(b), 'id'))
    guruLoaded = true
  } catch (err) {
    guruError.value = getErrorMessage(err, 'Gagal memuat daftar guru.')
  } finally {
    guruLoading.value = false
  }
}

function pick(g) {
  guru.value = g
  q.value = ''
  showError.value = false
}

function submit() {
  if (props.loading) return
  if (!guru.value) {
    showError.value = true
    searchEl.value?.focus()
    return
  }
  emit('confirm', guru.value.none ? null : guru.value.id)
}

watch(
  () => props.show,
  async (open) => {
    if (!open) return
    guru.value = null
    q.value = ''
    showError.value = false
    if (!guruLoaded) loadGuru()
    await nextTick()
    searchEl.value?.focus()
  }
)

const { onKeydown, onBackdrop } = useDialog(() => props.show, panel, {
  onClose: () => emit('cancel'),
  persistent: () => props.loading,
  initialFocus: 'input',
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
