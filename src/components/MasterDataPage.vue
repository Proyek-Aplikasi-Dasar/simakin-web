<template>
  <div class="p-8">
    <!-- Judul + tombol aksi -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold">{{ title }}</h1>
      <div class="flex gap-2">
        <button
          v-if="allowBulk"
          class="px-4 py-2 border border-primary text-primary hover:bg-blue-50 rounded-lg text-sm font-semibold"
          @click="showUpload = true"
        >
          Upload Excel
        </button>
        <button
          class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold"
          @click="openCreate"
        >
          + Tambah
        </button>
      </div>
    </div>

    <!-- Tiga keadaan: loading, error, normal -->
    <p v-if="loading" class="text-sm text-gray-500">Memuat data...</p>
    <div v-else-if="error" class="bg-red-50 text-red-600 text-sm rounded-lg p-4">{{ error }}</div>
    <BaseTable v-else :columns="columns" :data="data">
      <template #actions="{ row }">
        <button class="text-primary text-xs font-semibold mr-3" @click="openEdit(row)">Edit</button>
        <button class="text-red-500 text-xs font-semibold" @click="askDelete(row)">Hapus</button>
      </template>
    </BaseTable>

    <!-- Modal tambah / edit -->
    <BaseModal :show="showForm" :title="editingRow ? `Edit ${title}` : `Tambah ${title}`" @close="closeForm">
      <div class="max-h-[60vh] overflow-y-auto pr-1">
        <template v-for="f in fields" :key="f.key">
          <!-- Dropdown: dipakai kalau field punya "options" -->
          <div v-if="f.options" class="mb-4">
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">{{ f.label }}</label>
            <select
              v-model="form[f.key]"
              class="w-full border rounded-lg px-3 py-2 text-sm"
              :class="fieldErrors[f.key] ? 'border-red-400' : 'border-gray-300'"
            >
              <option value="" disabled>Pilih {{ f.label }}</option>
              <option v-for="o in f.options" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <p v-if="fieldErrors[f.key]" class="text-red-500 text-xs mt-1">{{ fieldErrors[f.key] }}</p>
          </div>

          <!-- Teks panjang -->
          <div v-else-if="f.type === 'textarea'" class="mb-4">
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">{{ f.label }}</label>
            <textarea
              v-model="form[f.key]"
              rows="3"
              class="w-full border rounded-lg px-3 py-2 text-sm"
              :class="fieldErrors[f.key] ? 'border-red-400' : 'border-gray-300'"
            ></textarea>
            <p v-if="fieldErrors[f.key]" class="text-red-500 text-xs mt-1">{{ fieldErrors[f.key] }}</p>
          </div>

          <!-- Input biasa -->
          <BaseFormField
            v-else
            v-model="form[f.key]"
            :label="f.label"
            :type="f.type || 'text'"
            :error="fieldErrors[f.key]"
          />
        </template>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <button class="px-4 py-2 border rounded-lg text-sm" :disabled="saving" @click="closeForm">Batal</button>
        <button
          :disabled="saving"
          class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold disabled:opacity-60"
          @click="submitForm"
        >
          {{ saving ? 'Menyimpan...' : 'Simpan' }}
        </button>
      </div>
    </BaseModal>

    <!-- Modal konfirmasi hapus -->
    <BaseModal :show="!!rowToDelete" title="Konfirmasi Hapus" @close="rowToDelete = null">
      <p class="text-sm text-gray-600">{{ deleteMessage }}</p>
      <div class="flex justify-end gap-2 mt-4">
        <button class="px-4 py-2 border rounded-lg text-sm" @click="rowToDelete = null">Batal</button>
        <button class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold" @click="confirmDelete">
          Hapus
        </button>
      </div>
    </BaseModal>

    <!-- Modal upload Excel -->
    <BaseModal :show="showUpload" title="Upload Excel" @close="closeUpload">
      <FileUpload @file-selected="onFileSelected" />
      <div class="flex justify-end gap-2 mt-4">
        <button class="px-4 py-2 border rounded-lg text-sm" @click="closeUpload">Batal</button>
        <button
          :disabled="!selectedFile"
          class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold disabled:opacity-40"
          @click="submitUpload"
        >
          Unggah
        </button>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import BaseTable from './BaseTable.vue'
import BaseModal from './BaseModal.vue'
import BaseFormField from './BaseFormField.vue'
import FileUpload from './FileUpload.vue'
import { useToastStore } from '../stores/toast'

const props = defineProps({
  title: { type: String, required: true },
  columns: { type: Array, required: true }, 
  fields: { type: Array, required: true },  
  data: { type: Array, default: () => [] },
  loading: Boolean,
  error: { type: String, default: '' },
  allowBulk: Boolean,
  saving: Boolean, 
  closeOnSave: { type: Boolean, default: true }, 
  fieldErrors: { type: Object, default: () => ({}) }, 
  deleteMessage: { type: String, default: 'Data yang dihapus tidak bisa dikembalikan. Lanjutkan?' },
})

const emit = defineEmits(['save', 'delete', 'bulk-upload', 'clear-errors'])

const toast = useToastStore()

// Form tambah / edit 
const showForm = ref(false)
const editingRow = ref(null)
const form = reactive({})

function resetForm(row = null) {
  props.fields.forEach((f) => {
    form[f.key] = row ? (row[f.key] ?? '') : ''
  })
}
function openCreate() {
  emit('clear-errors')
  editingRow.value = null
  resetForm()
  showForm.value = true
}
function openEdit(row) {
  emit('clear-errors')
  editingRow.value = row
  resetForm(row)
  showForm.value = true
}
function closeForm() {
  showForm.value = false
  emit('clear-errors')
}
function submitForm() {
  emit('save', {
    mode: editingRow.value ? 'edit' : 'create',
    row: editingRow.value,
    values: { ...form },
  })
  if (props.closeOnSave) closeForm()
}

// Hapus 
const rowToDelete = ref(null)
function askDelete(row) {
  rowToDelete.value = row
}
function confirmDelete() {
  emit('delete', rowToDelete.value)
  rowToDelete.value = null
}

// Upload Excel 
const showUpload = ref(false)
const selectedFile = ref(null)

function onFileSelected(file) {
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
    selectedFile.value = null
    toast.show('Format file harus .xlsx, .xls, atau .csv', 'error')
    return
  }
  selectedFile.value = file
}
function closeUpload() {
  showUpload.value = false
  selectedFile.value = null
}
function submitUpload() {
  emit('bulk-upload', selectedFile.value)
  closeUpload()
}

defineExpose({ closeForm })
</script>