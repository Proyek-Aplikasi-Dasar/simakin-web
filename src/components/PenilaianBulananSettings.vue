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

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" title="Menunggu endpoint BE">
        <button
          v-for="(nama, i) in BULAN"
          :key="nama"
          type="button"
          role="switch"
          disabled
          :aria-checked="bulanAktif[i]"
          :aria-label="`Bulan ${nama}`"
          :class="[
            'flex min-h-[58px] cursor-not-allowed items-center justify-between rounded-xl border px-4 py-2.5 text-left opacity-60',
            bulanAktif[i] ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white',
          ]"
        >
          <span class="flex flex-col gap-0.5">
            <span class="text-xs font-semibold leading-4 text-slate-900">{{ nama }}</span>
            <span :class="['text-[11px] font-semibold leading-[14px]', bulanAktif[i] ? 'text-emerald-700' : 'text-slate-500']">
              {{ bulanAktif[i] ? 'Dibuka' : 'Ditutup' }}
            </span>
          </span>
          <span :class="['relative h-6 w-10 shrink-0 rounded-full', bulanAktif[i] ? 'bg-blue-600' : 'bg-slate-200']">
            <span
              :class="[
                'absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm',
                bulanAktif[i] ? 'left-[19px]' : 'left-[3px]',
              ]"
            ></span>
          </span>
        </button>
      </div>

      <p class="-mt-2 text-[11px] text-slate-400">Pengaturan bulan aktif menunggu endpoint dari BE.</p>
    </div>

    <template #footer>
      <button type="button" class="cursor-not-allowed px-3 text-sm font-semibold text-blue-600 opacity-50" disabled title="Menunggu endpoint BE">
        Batal
      </button>
      <button
        type="button"
        disabled
        title="Menunggu endpoint BE"
        class="flex h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white opacity-60"
      >
        <AppIcon name="save" class="h-4 w-4" />
        Simpan Perubahan
      </button>
    </template>
  </FormCard>
</template>

<script setup>
import { ref, computed } from 'vue'
import FormCard from './FormCard.vue'
import InfoAlert from './InfoAlert.vue'
import AppIcon from './AppIcon.vue'

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

// BE belum punya endpoint pengaturan penilaian bulanan: semua kontrol disabled.
const bulanAktif = ref(Array(12).fill(false))
const aktif = computed(() => bulanAktif.value.filter(Boolean).length)
</script>
