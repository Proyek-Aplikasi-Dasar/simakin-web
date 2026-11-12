<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
    @click.self="close"
  >
    <form
      class="w-full max-w-[400px] rounded-2xl bg-white p-5 shadow-xl"
      role="dialog"
      aria-modal="true"
      novalidate
      @submit.prevent="submit"
    >
      <span class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <AppIcon name="key-round" class="h-5 w-5" />
      </span>

      <h2 class="mt-3 text-sm font-semibold text-slate-900">Reset kata sandi</h2>
      <p class="mt-1 text-xs leading-5 text-slate-600">
        Atur kata sandi baru untuk <span class="font-semibold text-slate-900">{{ user?.name }}</span>.
        Semua sesi login pengguna ini akan dikeluarkan.
      </p>

      <div class="mt-4 flex flex-col gap-4">
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-semibold text-slate-900">Kata Sandi Baru</span>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            placeholder="Minimal 8 karakter"
            :class="inputClass(error)"
          />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-semibold text-slate-900">Konfirmasi Kata Sandi Baru</span>
          <input
            v-model="confirmation"
            type="password"
            autocomplete="new-password"
            placeholder="Ulangi kata sandi baru"
            :class="inputClass(error)"
          />
        </label>

        <p v-if="error" class="text-[11px] text-red-600">{{ error }}</p>
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <button
          type="button"
          :disabled="saving"
          class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
          @click="close"
        >
          Batal
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <AppIcon name="save" class="h-4 w-4" />
          {{ saving ? 'Menyimpan...' : 'Simpan Kata Sandi' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import api, { getErrorMessage } from '../services/api'
import { useToastStore } from '../stores/toast'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  show: Boolean,
  user: { type: Object, default: null }, // { id, name }
})
const emit = defineEmits(['close', 'saved'])

const toast = useToastStore()
const password = ref('')
const confirmation = ref('')
const error = ref('')
const saving = ref(false)

// Kosongkan form setiap dialog dibuka
watch(
  () => props.show,
  (open) => {
    if (open) {
      password.value = ''
      confirmation.value = ''
      error.value = ''
    }
  }
)

const inputClass = (hasError) => [
  'h-10 rounded-xl border bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2',
  hasError ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-200',
]

function close() {
  if (!saving.value) emit('close')
}

async function submit() {
  if (saving.value || !props.user) return

  if (password.value.length < 8) {
    error.value = 'Kata sandi minimal 8 karakter.'
    return
  }
  if (password.value !== confirmation.value) {
    error.value = 'Konfirmasi kata sandi tidak cocok.'
    return
  }

  saving.value = true
  error.value = ''
  try {
    const { data } = await api.put(`/api/users/${props.user.id}/password`, {
      password: password.value,
      password_confirmation: confirmation.value,
    })
    toast.show(data.message || 'Kata sandi berhasil direset.')
    emit('saved')
    emit('close')
  } catch (err) {
    if (err.response?.status === 422) {
      error.value = getErrorMessage(err, 'Data tidak valid.')
    } else if (![401, 403, 419, 429].includes(err.response?.status) && (err.response?.status ?? 500) < 500) {
      toast.show(getErrorMessage(err), 'error')
    }
  } finally {
    saving.value = false
  }
}
</script>