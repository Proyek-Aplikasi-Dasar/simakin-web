<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Penilaian', to: '/admin/penilaian' }, { label: 'Detail Penilaian' }]"
      title="Detail Penilaian"
      subtitle="Nilai bulanan dari pembimbing industri dan nilai akhir dari guru pembimbing."
    >
      <button
        type="button"
        disabled
        title="Menunggu endpoint BE"
        class="flex h-[42px] cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold leading-5 text-slate-900 opacity-60"
      >
        <AppIcon name="printer" class="h-5 w-5 text-slate-600" />
        Cetak Rapor PKL
      </button>
    </PageHeader>

    <div v-if="error" class="flex flex-col items-center gap-3 py-16 text-center">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">Coba lagi</button>
    </div>

    <p v-else-if="loading" class="py-16 text-center text-sm text-slate-400">Memuat data penilaian…</p>

    <div v-else class="flex flex-col gap-6">
      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div class="relative h-[85px] overflow-hidden bg-blue-600">
          <span class="absolute -right-10 -top-24 h-52 w-72 rounded-full bg-blue-700"></span>
        </div>
        <div class="flex items-end justify-between gap-4 px-6 pb-5">
          <div class="flex items-end gap-5">
            <span class="-mt-10 flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-blue-600 max-md:h-20 max-md:w-20">
              <AppIcon name="user" class="h-12 w-12" />
            </span>
            <div class="pb-1">
              <h2 class="text-xl font-bold leading-7 tracking-[-0.02em] text-slate-900">{{ siswa?.nama || '—' }}</h2>
              <p class="text-sm leading-5 text-slate-600">{{ subSiswa }}</p>
            </div>
          </div>
          <span
            v-if="siswa?.statusBulanIni"
            :class="['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', STATUS[siswa.statusBulanIni].box]"
          >
            <span :class="['h-1.5 w-1.5 rounded-full', STATUS[siswa.statusBulanIni].dot]" />
            {{ STATUS[siswa.statusBulanIni].label }}
          </span>
        </div>

        <div class="grid grid-cols-1 gap-6 border-t border-slate-100 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
          <InfoItem icon="user-check" label="Guru Pembimbing" :value="siswa?.guru" />
          <InfoItem icon="user" label="Pembimbing Industri" :value="siswa?.pembimbingIndustri" />
          <InfoItem icon="award" label="Rata-rata Bulanan" :value="siswa?.rataRataBulanan != null ? `${fmt(siswa.rataRataBulanan)} / 100` : ''" />
          <InfoItem icon="clipboard-check" label="Nilai Akhir" :value="siswa?.nilaiAkhir != null ? `${fmt(siswa.nilaiAkhir)} / 100` : 'Belum diinput'" />
        </div>
      </section>

      <div class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <button
          v-for="b in tabsBulan"
          :key="b.no"
          type="button"
          :disabled="b.status === 'terkunci'"
          :class="[
            'flex items-center gap-3 rounded-2xl border px-4 py-3 text-left',
            bulanAktif === b.no
              ? 'border-blue-600 bg-blue-600 text-white'
              : b.status === 'terkunci'
                ? 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-500'
                : 'border-slate-100 bg-white text-slate-900 hover:bg-slate-50',
          ]"
          @click="pilihBulan(b.no)"
        >
          <AppIcon
            :name="b.status === 'terkunci' ? 'lock' : 'circle-check'"
            :class="[
              'h-6 w-6 shrink-0',
              b.status === 'terkunci' ? 'text-slate-400' : b.status === 'berjalan' ? 'text-yellow-400' : 'text-emerald-700',
            ]"
          />
          <span class="flex flex-col">
            <span class="text-xs font-semibold leading-4">Bulan {{ b.no }}</span>
            <span :class="['text-xs leading-4', bulanAktif === b.no ? 'text-blue-100' : 'text-slate-500']">{{ b.label }}</span>
          </span>
        </button>
      </div>

      <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_380px]">
        <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <div class="flex items-start justify-between gap-4 px-6 py-5">
            <div class="flex flex-col gap-0.5">
              <h2 class="text-base font-semibold leading-6 tracking-[-0.02em] text-slate-900">{{ judulBulan }}</h2>
              <p class="text-xs leading-[18px] text-slate-500">Diisi pembimbing industri lewat HP siswa.</p>
            </div>
            <router-link
              v-if="bulanDipilih"
              :to="{ path: `/admin/penilaian/${siswaId}/bulan/${bulanDipilih.no}/${aspek.length ? 'edit' : 'isi'}`, query: { periode: bulanDipilih.panjang } }"
              class="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
            >
              <AppIcon name="pencil" class="h-4 w-4 text-slate-600" />
              {{ aspek.length ? 'Edit Penilaian' : 'Isi Penilaian' }}
            </router-link>
          </div>

          <div class="flex items-center gap-4 bg-slate-100 px-6 py-2.5">
            <span class="flex-1 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Aspek Penilaian</span>
            <span class="w-[130px] text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Kategori</span>
            <span class="w-[180px] text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Capaian</span>
            <span class="w-[70px] text-right text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">Nilai</span>
          </div>

          <p v-if="!aspek.length" class="px-6 py-12 text-center text-sm text-slate-400">Belum ada penilaian untuk bulan ini.</p>

          <div v-else class="divide-y divide-slate-100">
            <div v-for="a in aspek" :key="a.nama" class="flex items-center gap-4 px-6 py-3.5">
              <span class="min-w-0 flex-1 truncate text-xs font-semibold leading-[18px] text-slate-900" :title="a.nama">{{ a.nama }}</span>

              <div class="w-[130px]">
                <span :class="['inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold leading-4', KATEGORI[a.kategori].box]">
                  <span :class="['h-1.5 w-1.5 rounded-full', KATEGORI[a.kategori].dot]" />
                  {{ KATEGORI[a.kategori].label }}
                </span>
              </div>

              <div class="w-[180px]">
                <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div :class="['h-full rounded-full', KATEGORI[a.kategori].bar]" :style="{ width: Math.min(100, a.nilai) + '%' }" />
                </div>
              </div>

              <span class="w-[70px] text-right text-xs text-slate-500">
                <span class="text-sm font-bold text-slate-900">{{ a.nilai }}</span> /100
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between bg-blue-50 px-6 py-4">
            <span class="text-sm font-semibold text-blue-600">Nilai rata-rata bulan ini</span>
            <span class="text-lg font-bold text-blue-600">{{ fmt(rataBulanIni) }}</span>
          </div>
        </section>

        <aside class="flex flex-col gap-6">
          <FormCard title="Foto Pembimbing Industri" description="Diambil saat pengisian di HP siswa, divalidasi otomatis.">
            <img v-if="fotoSrc" :src="fotoSrc" alt="Foto pembimbing industri" class="h-[200px] w-full rounded-2xl bg-slate-100 object-cover" />
            <div v-else class="flex h-[200px] flex-col items-center justify-center gap-1 rounded-2xl bg-slate-200 text-slate-400">
              <AppIcon name="camera" class="h-9 w-9" />
              <p class="mt-1 text-sm font-semibold text-slate-600">Foto Pembimbing</p>
              <p class="text-xs text-slate-500">{{ penilaian?.waktuKirim || 'Belum ada foto' }}</p>
            </div>
            <p v-if="fotoSrc && penilaian?.waktuKirim" class="mt-3 text-center text-xs text-slate-500">{{ penilaian.waktuKirim }}</p>
          </FormCard>

          <FormCard title="Nilai Akhir PKL" description="Diinput guru pembimbing, terlihat oleh siswa.">
            <div class="flex flex-col gap-4">
              <InfoItem icon="clipboard-check" label="Rata-rata Bulanan" :value="siswa?.rataRataBulanan != null ? fmt(siswa.rataRataBulanan) : ''" />
              <InfoItem
                icon="award"
                label="Nilai Akhir"
                :value="siswa?.nilaiAkhir != null ? fmt(siswa.nilaiAkhir) : ''"
                :hint="siswa?.nilaiAkhir != null ? 'Diinput guru pembimbing' : 'Belum diinput guru pembimbing'"
              />
              <InfoItem icon="message-circle" label="Catatan Guru" :value="siswa?.catatanGuru" hint="Muncul di aplikasi siswa bersama nilai." />
              <router-link
                :to="`/admin/penilaian/${siswaId}/nilai-akhir${siswa?.nilaiAkhir != null ? '/edit' : ''}`"
                class="flex h-9 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
              >
                <AppIcon name="pencil" class="h-4 w-4 text-slate-600" />
                {{ siswa?.nilaiAkhir != null ? 'Edit Nilai Akhir' : 'Isi Nilai Akhir' }}
              </router-link>
            </div>
          </FormCard>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { fotoUrl } from '../../utils/presensi'
import PageHeader from '../../components/PageHeader.vue'
import FormCard from '../../components/FormCard.vue'
import InfoItem from '../../components/InfoItem.vue'
import AppIcon from '../../components/AppIcon.vue'

const props = defineProps({ siswaId: { type: [String, Number], required: true } })

const TOTAL_BULAN = 6

const STATUS = {
  sudah: { label: 'Sudah Diisi', box: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-700' },
  belum: { label: 'Belum Diisi', box: 'border-slate-200 bg-slate-100 text-slate-600', dot: 'bg-slate-500' },
}

const KATEGORI = {
  soft_skill: { label: 'Soft Skill', box: 'border-blue-100 bg-blue-50 text-blue-700', dot: 'bg-blue-600', bar: 'bg-emerald-700' },
  kompetensi: { label: 'Kompetensi', box: 'border-slate-200 bg-slate-100 text-slate-600', dot: 'bg-slate-500', bar: 'bg-blue-600' },
}

const loading = ref(false)
const error = ref('')
const siswa = ref(null)
const bulanList = ref([])
const bulanAktif = ref(null)
const penilaian = ref(null)

async function load() {

}

async function loadPenilaian(no) {
  penilaian.value = null
}

function pilihBulan(no) {
  const b = bulanList.value.find((x) => x.no === no)
  if (b && b.status !== 'terkunci') bulanAktif.value = no
}

const subSiswa = computed(() => {
  const s = siswa.value
  if (!s) return '—'
  return ['NIS ' + (s.nis ?? '—'), s.kelas, s.perusahaan].filter(Boolean).join(' · ')
})

const tabsBulan = computed(() =>
  bulanList.value.length
    ? bulanList.value
    : Array.from({ length: TOTAL_BULAN }, (_, i) => ({ no: i + 1, label: '—', status: 'terkunci' }))
)

const bulanDipilih = computed(() => bulanList.value.find((b) => b.no === bulanAktif.value) ?? null)
const judulBulan = computed(() =>
  bulanDipilih.value ? `Penilaian Bulan ke-${bulanDipilih.value.no} · ${bulanDipilih.value.panjang}` : 'Penilaian Bulanan'
)

const aspek = computed(() => penilaian.value?.aspek ?? [])
const rataBulanIni = computed(() =>
  aspek.value.length ? aspek.value.reduce((t, a) => t + Number(a.nilai), 0) / aspek.value.length : null
)

const fotoSrc = computed(() => fotoUrl(penilaian.value?.foto))

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('id-ID', { maximumFractionDigits: 1 }))

watch(bulanAktif, (no) => (no ? loadPenilaian(no) : (penilaian.value = null)))
watch(() => props.siswaId, load)
onMounted(load)
</script>