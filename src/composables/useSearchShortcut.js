import { onMounted, onBeforeUnmount } from 'vue'

// Ctrl/Cmd + K memfokuskan kolom pencarian.
// target: ref ke elemen <input>, contoh const searchInput = ref(null)
export function useSearchShortcut(target) {
  function onKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      target.value?.focus()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}
