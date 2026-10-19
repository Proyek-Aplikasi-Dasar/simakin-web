<template>
  <div class="p-8">
    <PageHeader
      :breadcrumb="[{ label: 'Data Master' }, { label: activeTab.label }]"
      title="Data Master"
      subtitle="Kelola data referensi yang dipakai di aplikasi siswa dan guru."
    >
      <button
        type="button"
        disabled
        title="Menunggu BE"
        class="flex h-10 cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold opacity-50"
      >
        <AppIcon name="file" class="h-4 w-4" />
        Export / Import
      </button>

      <router-link
        v-if="activeTab.entity"
        :to="`/admin/data-master/${activeTab.key}/tambah`"
        class="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <AppIcon name="plus" class="h-4 w-4" />
        Tambah {{ activeTab.entity }}
      </router-link>
    </PageHeader>

    <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <!-- Tab -->
      <div class="flex gap-8 overflow-x-auto border-b border-slate-200 px-6">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="[
            'flex items-center gap-2 whitespace-nowrap border-b-2 py-4 text-sm font-semibold',
            tab.key === activeTab.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900',
          ]"
          @click="selectTab(tab.key)"
        >
          {{ tab.label }}
          <span
            v-if="tab.resource && !tab.resource.loading"
            class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
          >
            {{ tab.resource.rows.length }}
          </span>
        </button>
      </div>

      <MasterTab
        v-if="activeTab.key === 'jurusan'"
        key="jurusan"
        title="Data Jurusan"
        subtitle="Jurusan yang dipakai untuk penempatan PKL."
        entity="jurusan"
        base-path="/admin/data-master/jurusan"
        :columns="jurusanColumns"
        :resource="jurusan"
        delete-message="Menghapus jurusan juga akan menghapus semua kompetensi di dalamnya."
      />

      <MasterTab
        v-else-if="activeTab.key === 'kompetensi'"
        key="kompetensi"
        title="Data Kompetensi"
        subtitle="Kompetensi yang dinilai selama PKL, dikelompokkan per jurusan."
        entity="kompetensi"
        base-path="/admin/data-master/kompetensi"
        :columns="kompetensiColumns"
        :resource="kompetensi"
      />

      <div v-else class="px-6 py-16 text-center text-sm text-slate-500">
        Data {{ activeTab.label }} belum tersedia. Menunggu endpoint dari BE.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '../../components/PageHeader.vue'
import AppIcon from '../../components/AppIcon.vue'
import MasterTab from '../../components/MasterTab.vue'
import { useMasterResource } from '../../composables/useMasterResource'

const route = useRoute()
const router = useRouter()

const jurusan = reactive(useMasterResource('/api/jurusan', { name: 'Jurusan' }))
const kompetensi = reactive(
  useMasterResource('/api/kompetensi', {
    name: 'Kompetensi',
    normalize: (row) => ({ ...row, jurusan_nama: row.jurusan?.nama ?? '-' }),
  })
)

const jurusanColumns = [
  { key: 'kode', label: 'Kode', cellClass: 'font-semibold text-blue-600' },
  { key: 'nama', label: 'Jurusan', cellClass: 'font-semibold text-slate-900' },
]
const kompetensiColumns = [
  { key: 'kode', label: 'Kode', cellClass: 'font-semibold text-blue-600' },
  { key: 'nama', label: 'Kompetensi', cellClass: 'font-semibold text-slate-900' },
  { key: 'jurusan_nama', label: 'Jurusan', cellClass: 'text-slate-600' },
]

const tabs = [
  { key: 'jurusan', label: 'Jurusan', entity: 'Jurusan', resource: jurusan },
  { key: 'kompetensi', label: 'Kompetensi KI/KD', entity: 'Kompetensi', resource: kompetensi },
  { key: 'soft-skill', label: 'Soft Skill' },
  { key: 'gelombang', label: 'Gelombang PKL' },
  { key: 'perusahaan', label: 'Perusahaan Mitra' },
]

const activeTab = computed(() => tabs.find((t) => t.key === route.query.tab) ?? tabs[0])

function selectTab(key) {
  router.replace({ query: { tab: key } })
}

onMounted(() => {
  jurusan.load()
  kompetensi.load()
})
</script>