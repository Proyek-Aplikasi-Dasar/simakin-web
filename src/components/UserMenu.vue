<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-1 hover:bg-slate-50 md:pr-2"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <AppIcon name="user" class="h-5 w-5" />
      </span>
      <div class="hidden text-left md:block">
        <p class="text-sm font-semibold leading-5">{{ name }}</p>
        <p class="text-[11px] leading-[14px] text-slate-500">{{ roleLabel }}</p>
      </div>
      <AppIcon
        name="chevron-down"
        :class="['hidden h-4 w-4 text-slate-500 transition-transform md:block', open ? 'rotate-180' : '']"
      />
    </button>

    <div
      v-if="open"
      role="menu"
      class="absolute right-0 top-full z-30 mt-2 flex w-60 flex-col gap-0.5 overflow-hidden rounded-xl border border-slate-100 bg-white p-2 shadow-[0_4px_8px_-4px_rgba(15,23,42,0.06),0_12px_24px_-4px_rgba(15,23,42,0.1)]"
    >
      <div class="flex flex-col gap-0.5 px-3 pb-2.5 pt-2">
        <p class="truncate text-sm font-semibold leading-5 text-slate-900">{{ name }}</p>
        <p class="text-[11px] leading-[14px] text-slate-600">{{ roleLabel }}</p>
      </div>
      <div class="h-px bg-slate-100"></div>

      <router-link
        v-if="profilTo"
        :to="profilTo"
        role="menuitem"
        class="flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-slate-900 hover:bg-slate-50"
        @click="open = false"
      >
        <AppIcon name="user" class="h-5 w-5" />
        Profil Saya
      </router-link>
      <span
        v-else
        role="menuitem"
        aria-disabled="true"
        title="Segera hadir"
        class="flex h-10 cursor-not-allowed items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-slate-900 opacity-60"
      >
        <AppIcon name="user" class="h-5 w-5" />
        Profil Saya
      </span>

      <button
        type="button"
        role="menuitem"
        class="flex h-10 items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium text-red-700 hover:bg-red-50"
        @click="keluar"
      >
        <AppIcon name="logout" class="h-5 w-5" />
        Keluar
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import AppIcon from './AppIcon.vue'

defineProps({
  name: { type: String, default: '' },
  roleLabel: { type: String, required: true },
  profilTo: { type: String, default: '' },
})
const emit = defineEmits(['logout'])

const open = ref(false)
const root = ref(null)

function keluar() {
  open.value = false
  emit('logout')
}

function onDocClick(e) {
  if (open.value && root.value && !root.value.contains(e.target)) open.value = false
}
function onKey(e) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>
