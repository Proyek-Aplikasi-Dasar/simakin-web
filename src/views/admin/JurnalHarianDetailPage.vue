<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Jurnal Harian', to: '/admin/jurnal-harian' }, { label: 'Detail Jurnal' }]"
      title="Detail Jurnal"
      subtitle="Jurnal harian yang dikirim siswa lewat aplikasi."
    >
      <router-link
        to="/admin/jurnal-harian"
        class="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <AppIcon name="arrow-left" class="h-4 w-4" />
        Kembali
      </router-link>
      <router-link
        :to="isBelum ? `/admin/jurnal-harian/tambah?siswa_id=${siswaId}&tanggal=${tanggal}` : `/admin/jurnal-harian/${id}/edit`"
        class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <AppIcon name="pencil" class="h-4 w-4" />
        {{ isBelum ? 'Tambah Jurnal' : 'Edit Jurnal' }}
      </router-link>
    </PageHeader>

    <div class="flex flex-col gap-6">
      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div class="relative h-[70px] overflow-hidden bg-blue-600">
          <div class="absolute -right-12 -top-16 h-40 w-72 rounded-full bg-blue-700/70"></div>
        </div>
        <div class="flex items-end justify-between gap-4 px-6 pb-5">
          <div class="flex items-end gap-5">
            <span class="-mt-9 flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-blue-600">
              <AppIcon name="user" class="h-9 w-9" />
            </span>
            <div class="pb-1">
              <h2 class="text-xl font-bold leading-7 tracking-[-0.02em] text-slate-900">{{ siswa?.nama || '—' }}</h2>
              <p class="text-sm leading-5 text-slate-600">
                NIS {{ siswa?.nis || '—' }} · {{ siswa?.kelas || '—' }} · {{ siswa?.perusahaan || '—' }}
              </p>
            </div>
          </div>
          <span :class="['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', statusInfo.box]">
            <span :class="['h-1.5 w-1.5 rounded-full', statusInfo.dot]" />
            {{ statusInfo.label }}
          </span>
        </div>
        <div class="grid grid-cols-1 gap-6 border-t border-slate-100 px-6 py-5 md:grid-cols-2 xl:grid-cols-5">
          <InfoItem icon="calendar" label="Tanggal" :value="tanggalLabel" />
          <InfoItem icon="file" label="Kompetensi" :value="jurnal?.kompetensi || '—'" />
          <InfoItem icon="user-check" label="Guru Pembimbing" :value="siswa?.pembimbing || '—'" />
          <InfoItem icon="hourglass" label="Jam Shift" :value="jurnal?.jamShift || siswa?.jamShift || '—'" />
          <InfoItem icon="arrow-right" label="Waktu Kirim" :value="jurnal?.waktuKirim || '—'" />
        </div>
      </section>

      <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_380px]">
        <FormCard title="Isi Jurnal" description="Kompetensi yang dipilih siswa dan deskripsi kegiatan.">
          <div v-if="isBelum" class="flex flex-col items-center gap-2 py-10 text-center">
            <span class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <AppIcon name="file" class="h-6 w-6" />
            </span>
            <p class="text-sm font-semibold text-slate-900">Siswa belum mengirim jurnal hari ini</p>
            <p class="text-xs text-slate-500">Admin bisa menambahkan jurnal atas nama siswa.</p>
          </div>

          <div v-else class="flex flex-col gap-5">
            <div>
              <p class="mb-2 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Kompetensi</p>
              <div class="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600">
                <AppIcon name="file" class="h-5 w-5" />
                {{ jurnal?.kompetensi || '—' }}
              </div>
            </div>
            <div>
              <p class="mb-2 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Deskripsi (opsional)</p>
              <p class="text-sm leading-6 text-slate-900">{{ jurnal?.deskripsi || '—' }}</p>
            </div>
          </div>
        </FormCard>

        <aside class="flex flex-col gap-6">
          <FormCard
            title="Koreksi Jurnal"
            :description="isBelum ? 'Admin bisa menambahkan atau mengoreksi jurnal siswa.' : 'Admin bisa mengubah kompetensi dan deskripsi jurnal siswa.'"
          >
            <p class="text-sm leading-6 text-slate-600">
              <template v-if="isBelum">Belum ada jurnal. Tambahkan jurnal atas nama siswa lewat tombol Tambah Data.</template>
              <template v-else>Jurnal langsung tercatat saat siswa menyimpannya, tanpa persetujuan. Gunakan koreksi bila ada data yang perlu diperbaiki.</template>
            </p>
            <router-link
              v-if="!isBelum"
              :to="`/admin/jurnal-harian/${id}/edit`"
              class="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <AppIcon name="save" class="h-5 w-5" />
              Edit Jurnal
            </router-link>
          </FormCard>

          <FormCard title="Riwayat">
            <ul class="flex flex-col gap-5">
              <li v-for="(r, i) in riwayatTampil" :key="i" class="flex items-start gap-3">
                <span :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', RIWAYAT_TONE[r.tipe]?.box]">
                  <AppIcon :name="RIWAYAT_TONE[r.tipe]?.icon || 'file'" class="h-5 w-5" />
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-2">
                    <p :class="['text-[10px] font-semibold uppercase leading-4 tracking-[0.6px]', RIWAYAT_TONE[r.tipe]?.label]">{{ r.label }}</p>
                    <span class="text-xs text-slate-500">{{ r.waktu || '—' }}</span>
                  </div>
                  <p class="text-sm font-semibold leading-5 text-slate-900">{{ r.title }}</p>
                  <p class="text-xs leading-5 text-slate-500">{{ r.desc }}</p>
                </div>
              </li>
            </ul>
          </FormCard>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { formatDate, hariName } from '../../utils/siswa'
import { JURNAL_STATUS, RIWAYAT_TONE } from '../../utils/jurnal'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import InfoItem from '../../components/InfoItem.vue'
import AppIcon from '../../components/AppIcon.vue'

const props = defineProps({
  id: { type: [String, Number], default: null },
  siswaId: { type: [String, Number], default: null },
})
const route = useRoute()

const siswa = ref(null)
const jurnal = ref(null)
const riwayat = ref([])

const isBelum = computed(() => !props.id)
const statusInfo = computed(() => JURNAL_STATUS[isBelum.value ? 'belum' : 'sudah'])
const tanggal = computed(() => (isBelum.value ? route.query.tanggal : jurnal.value?.tanggal))
const tanggalLabel = computed(() => (tanggal.value ? `${hariName(tanggal.value)}, ${formatDate(tanggal.value)}` : '—'))

const riwayatTampil = computed(() =>
  isBelum.value
    ? [{ tipe: 'belum', label: 'Belum mengisi', title: 'Belum ada jurnal hari ini', desc: 'Siswa belum mengirim jurnal.', waktu: '' }]
    : riwayat.value
)
</script>