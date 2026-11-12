<template>
  <FormCard
    title="Penilaian Bulanan"
    :description="`Pilih bulan saat pembimbing industri boleh mengisi penilaian lewat HP siswa. Sekarang ${aktif} dari 12 bulan aktif.`"
  >
    <div class="flex flex-col gap-5">
      <InfoAlert
        icon="calendar-check"
        title="Bulan yang ditutup tidak muncul di penilaian"
        text="Pada bulan yang ditutup, siswa tidak bisa membuka form Penilaian Bulanan dan nilai tidak bisa diisi. Nilai yang sudah masuk tetap tersimpan."
      />

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <button
          v-for="(nama, i) in BULAN"
          :key="nama"
          type="button"
          role="switch"
          :aria-checked="bulanAktif[i]"
          :aria-label="`Bulan ${nama}`"
          :class="[
            'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors',
            bulanAktif[i] ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50',
          ]"
          @click="bulanAktif[i] = !bulanAktif[i]"
        >
          <span class="flex flex-col gap-0.5">
            <span class="text-xs font-semibold leading-4 text-slate-900">{{ nama }}</span>
            <span :class="['text-[11px] font-semibold leading-[14px]', bulanAktif[i] ? 'text-emerald-700' : 'text-slate-500']">
              {{ bulanAktif[i] ? 'Dibuka' : 'Ditutup' }}
            </span>
          </span>
          <span :class="['relative h-6 w-10 shrink-0 rounded-full transition-colors', bulanAktif[i] ? 'bg-blue-600' : 'bg-slate-200']">
            <span
              :class="[
                'absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all',
                bulanAktif[i] ? 'left-[19px]' : 'left-[3px]',
              ]"
            ></span>
          </span>
        </button>
      </div>

      <div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
        <FormField
          id="tanggal_dari"
          v-model="form.dari"
          type="number"
          inputmode="numeric"
          label="Dari Tanggal"
          hint="Tanggal tiap bulan. Berlaku untuk semua bulan yang dibuka."
          :error="errors.dari"
          @blur="cekTanggal"
        />
        <FormField
          id="tanggal_sampai"
          v-model="form.sampai"
          type="number"
          inputmode="numeric"
          label="Sampai Tanggal"
          :error="errors.sampai"
          @blur="cekTanggal"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="token_penilaian" class="text-xs font-semibold leading-4 text-slate-900">Token Penilaian</label>
        <div class="flex items-center gap-5">
          <input
            id="token_penilaian"
            :value="form.token"
            type="text"
            readonly
            placeholder="Belum ada token. Klik Buat Token Baru."
            inputmode="numeric"
            class="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none"
          />
          <button
            type="button"
            class="flex h-[42px] shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            @click="buatToken"
          >
            <svg class="h-5 w-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            Buat Token Baru
          </button>
        </div>
        <p class="text-[11px] leading-[14px] text-slate-500">Token 6 digit dikirim manual ke perusahaan oleh admin atau guru pembimbing.</p>
      </div>
    </div>

    <template #footer>
      <button type="button" class="px-3 text-sm font-semibold text-blue-600 disabled:opacity-50" :disabled="saving" @click="reset">
        Batal
      </button>
      <button
        type="button"
        :disabled="saving"
        class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        @click="submit"
      >
        <AppIcon name="save" class="h-4 w-4" />
        {{ saving ? 'Menyimpan…' : 'Simpan Perubahan' }}
      </button>
    </template>
  </FormCard>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useToastStore } from '../stores/toast'
import FormCard from './FormCard.vue'
import FormField from './FormField.vue'
import InfoAlert from './InfoAlert.vue'
import AppIcon from './AppIcon.vue'

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const toast = useToastStore()
const saving = ref(false)

// Nilai awal. TODO: ganti dengan data dari API pengaturan penilaian bulanan
const awal = () => ({ bulan: Array(12).fill(false), dari: '1', sampai: '10', token: '' })
let tersimpan = awal()

const bulanAktif = ref([...tersimpan.bulan])
const form = reactive({ dari: tersimpan.dari, sampai: tersimpan.sampai, token: tersimpan.token })
const errors = reactive({ dari: '', sampai: '' })

const aktif = computed(() => bulanAktif.value.filter(Boolean).length)

function acak6() {
  const a = new Uint32Array(1)
  crypto.getRandomValues(a)
  return String(a[0] % 1000000).padStart(6, '0')
}

function buatToken() {
  form.token = acak6()
}

function cekTanggal() {
  errors.dari = errors.sampai = ''
  const d = Number(form.dari)
  const s = Number(form.sampai)
  const valid = (v, raw) => String(raw).trim() !== '' && Number.isInteger(v) && v >= 1 && v <= 31
  if (!valid(d, form.dari)) errors.dari = 'Isi tanggal 1 – 31.'
  if (!valid(s, form.sampai)) errors.sampai = 'Isi tanggal 1 – 31.'
  if (!errors.dari && !errors.sampai && d > s) errors.sampai = 'Harus sama atau setelah tanggal awal.'
  return !errors.dari && !errors.sampai
}

function reset() {
  bulanAktif.value = [...tersimpan.bulan]
  Object.assign(form, { dari: tersimpan.dari, sampai: tersimpan.sampai, token: tersimpan.token })
  errors.dari = errors.sampai = ''
}

async function submit() {
  if (saving.value || !cekTanggal()) return
  saving.value = true
  try {
    const payload = {
      bulan_aktif: bulanAktif.value.map((on, i) => (on ? i + 1 : null)).filter(Boolean),
      tanggal_dari: Number(form.dari),
      tanggal_sampai: Number(form.sampai),
      token: form.token || null,
    }
    // TODO: sambungkan ke API pengaturan penilaian bulanan bila endpoint BE sudah ada
    void payload
    toast.warning('Penyimpanan belum tersambung: endpoint pengaturan penilaian belum tersedia di BE.')
  } finally {
    saving.value = false
  }
}

// TODO: muat pengaturan tersimpan dari API, isi bulanAktif/form, lalu set `tersimpan`
</script>
