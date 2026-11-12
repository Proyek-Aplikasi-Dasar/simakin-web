<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Lainnya' }, { label: 'Notifikasi' }]"
      title="Notifikasi"
      subtitle="Pemberitahuan sistem dan pengumuman untuk siswa dan guru."
    >
      <button
        type="button"
        :disabled="!unreadCount"
        class="flex h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold leading-5 text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        @click="tandaiSemua"
      >
        <AppIcon name="circle-check" class="h-5 w-5 text-slate-600" />
        Tandai semua dibaca
      </button>
    </PageHeader>

    <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <section class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <CardHeader
          title="Semua Notifikasi"
          :description="unreadCount ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'"
        />

        <div class="flex gap-4 overflow-x-auto border-b border-slate-200 px-6">
          <button
            v-for="t in tabs"
            :key="t.key"
            type="button"
            :class="[
              '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-1 py-3 text-sm font-semibold',
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700',
            ]"
            @click="tab = t.key"
          >
            {{ t.label }}
            <span :class="['rounded-full px-2 py-0.5 text-[11px] leading-[14px]', tab === t.key ? 'bg-blue-50' : 'bg-slate-200']">
              {{ t.count }}
            </span>
          </button>
        </div>

        <p v-if="loading" class="px-6 py-12 text-center text-sm text-slate-400">Memuat notifikasi…</p>
        <div v-else-if="error" class="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p class="text-sm text-red-600">{{ error }}</p>
          <button type="button" class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50" @click="load">Coba lagi</button>
        </div>
        <p v-else-if="!filtered.length" class="px-6 py-12 text-center text-sm text-slate-400">
          {{ tab === 'unread' ? 'Tidak ada notifikasi yang belum dibaca.' : 'Belum ada notifikasi.' }}
        </p>

        <div v-else class="flex flex-col gap-1 p-3">
          <template v-for="g in groups" :key="g.label">
            <p class="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase leading-4 tracking-[0.6px] text-slate-500">{{ g.label }}</p>

            <button
              v-for="n in g.items"
              :key="n.id"
              type="button"
              :class="[
                'flex w-full items-start gap-4 rounded-xl p-4 text-left',
                n.dibaca ? 'hover:bg-slate-50' : 'bg-slate-100 hover:bg-slate-200/70',
              ]"
              @click="buka(n)"
            >
              <span :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tipeOf(n).bubble]">
                <AppIcon :name="tipeOf(n).icon" :class="['h-5 w-5', tipeOf(n).text]" />
              </span>

              <span class="flex min-w-0 flex-1 flex-col gap-1">
                <span :class="['text-[10px] font-semibold uppercase leading-4 tracking-[0.06em]', tipeOf(n).text]">{{ tipeOf(n).label }}</span>
                <span class="text-xs font-semibold leading-[18px] text-slate-900">{{ n.judul }}</span>
                <span v-if="n.deskripsi" class="text-xs leading-[18px] text-slate-500">{{ n.deskripsi }}</span>
              </span>

              <span class="flex shrink-0 flex-col items-end gap-2">
                <span class="text-[11px] font-medium leading-[14px] text-slate-500">{{ waktuLabel(n.waktu) }}</span>
                <span v-if="!n.dibaca" class="h-2 w-2 rounded-full bg-blue-600" aria-label="Belum dibaca"></span>
              </span>
            </button>
          </template>

          <button
            v-if="tampil < filtered.length"
            type="button"
            class="mx-auto mt-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            @click="tampil += PAGE_SIZE"
          >
            Tampilkan lebih banyak
          </button>
        </div>
      </section>

      <form novalidate @submit.prevent="kirim">
        <FormCard title="Kirim Pengumuman" description="Broadcast ke aplikasi siswa dan panel guru.">
          <div class="flex flex-col gap-4">
            <FormField
              id="judul"
              v-model="form.judul"
              label="Judul"
              required
              placeholder="Contoh: Libur Nasional 17 Oktober"
              :maxlength="100"
              :error="errorOf('judul')"
              @blur="touch('judul')"
            />

            <RadioCardGroup id="penerima" v-model="form.penerima" label="Penerima" :options="penerimaOptions" />

            <FormField
              id="isi"
              v-model="form.isi"
              label="Isi Pengumuman"
              textarea
              required
              :rows="5"
              :maxlength="500"
              placeholder="Tulis isi pengumuman…"
              :hint="`${form.isi.length}/500 karakter`"
              :error="errorOf('isi')"
              @blur="touch('isi')"
            />

            <button
              type="submit"
              :disabled="sending"
              class="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <AppIcon name="send" class="h-5 w-5" />
              {{ sending ? 'Mengirim…' : 'Kirim Pengumuman' }}
            </button>
          </div>
        </FormCard>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getErrorMessage } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import { useFormValidation } from '../../composables/useFormValidation'
import { required, maxLength } from '../../utils/validators'
import PageHeader from '../../components/PageHeader.vue'
import CardHeader from '../../components/CardHeader.vue'
import FormCard from '../../components/FormCard.vue'
import FormField from '../../components/FormField.vue'
import RadioCardGroup from '../../components/RadioCardGroup.vue'
import AppIcon from '../../components/AppIcon.vue'

const PAGE_SIZE = 10

const router = useRouter()
const toast = useToastStore()

const TIPE = {
  pengajuan: { label: 'Pengajuan PKL', icon: 'file-plus', bubble: 'bg-yellow-50', text: 'text-yellow-700' },
  presensi: { label: 'Presensi', icon: 'clipboard-x', bubble: 'bg-red-50', text: 'text-red-700' },
  akun: { label: 'Akun', icon: 'user-plus', bubble: 'bg-blue-50', text: 'text-blue-600' },
  penilaian: { label: 'Penilaian', icon: 'star', bubble: 'bg-blue-50', text: 'text-blue-700' },
  lokasi: { label: 'Lokasi', icon: 'pin', bubble: 'bg-emerald-50', text: 'text-emerald-700' },
}
const tipeOf = (n) => TIPE[n.tipe] ?? { label: 'Info', icon: 'bell', bubble: 'bg-slate-100', text: 'text-slate-600' }

const penerimaOptions = [
  { value: 'semua', label: 'Semua pengguna' },
  { value: 'siswa', label: 'Siswa PKL saja' },
  { value: 'guru', label: 'Guru pembimbing saja' },
]


const notifs = ref([])
const loading = ref(false)
const error = ref('')
const tab = ref('all')
const tampil = ref(PAGE_SIZE)

async function load() {

}

const unreadCount = computed(() => notifs.value.filter((n) => !n.dibaca).length)
const countTipe = (t) => notifs.value.filter((n) => n.tipe === t).length

const tabs = computed(() => [
  { key: 'all', label: 'Semua', count: notifs.value.length },
  { key: 'unread', label: 'Belum Dibaca', count: unreadCount.value },
  { key: 'pengajuan', label: 'Pengajuan', count: countTipe('pengajuan') },
  { key: 'presensi', label: 'Presensi', count: countTipe('presensi') },
  { key: 'penilaian', label: 'Penilaian', count: countTipe('penilaian') },
])

const filtered = computed(() => {
  const list = [...notifs.value].sort((a, b) => new Date(b.waktu) - new Date(a.waktu))
  if (tab.value === 'all') return list
  if (tab.value === 'unread') return list.filter((n) => !n.dibaca)
  return list.filter((n) => n.tipe === tab.value)
})

const hariMulai = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const selisihHari = (iso) => Math.round((hariMulai(new Date()) - hariMulai(new Date(iso))) / 86400000)

const groups = computed(() => {
  const out = []
  for (const n of filtered.value.slice(0, tampil.value)) {
    const d = selisihHari(n.waktu)
    const label = d <= 0 ? 'Hari ini' : d === 1 ? 'Kemarin' : 'Sebelumnya'
    let g = out.find((x) => x.label === label)
    if (!g) out.push((g = { label, items: [] }))
    g.items.push(n)
  }
  return out
})

function waktuLabel(iso) {
  const date = new Date(iso)
  const d = selisihHari(iso)
  const jam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')
  if (d <= 0) {
    const menit = Math.floor((Date.now() - date.getTime()) / 60000)
    if (menit < 1) return 'Baru saja'
    if (menit < 60) return `${menit} menit lalu`
    return `${Math.floor(menit / 60)} jam lalu`
  }
  if (d === 1) return `Kemarin, ${jam}`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function buka(n) {
  if (!n.dibaca) {
    n.dibaca = true
  }
  if (n.link) router.push(n.link)
}

function tandaiSemua() {
  notifs.value.forEach((n) => (n.dibaca = true))
}

watch(tab, () => (tampil.value = PAGE_SIZE))

const sending = ref(false)
const form = reactive({ judul: '', penerima: 'semua', isi: '' })

const { errorOf, validate, touch } = useFormValidation(form, {
  judul: [required('Judul wajib diisi.'), maxLength(100, 'Judul maksimal 100 karakter.')],
  isi: [required('Isi pengumuman wajib diisi.'), maxLength(500, 'Isi maksimal 500 karakter.')],
})

async function kirim() {
  if (sending.value || !validate()) return
  sending.value = true
  try {
    const payload = { judul: form.judul.trim(), penerima: form.penerima, isi: form.isi.trim() }

    void payload
    toast.warning('Pengiriman belum tersambung: endpoint pengumuman belum tersedia di BE.')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Gagal mengirim pengumuman.'))
  } finally {
    sending.value = false
  }
}

onMounted(load)
</script>
