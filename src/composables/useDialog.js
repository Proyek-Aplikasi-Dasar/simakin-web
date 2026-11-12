import { watch, nextTick, onBeforeUnmount } from 'vue'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

let lockCount = 0
function lockScroll() {
  if (lockCount++ === 0) document.body.style.overflow = 'hidden'
}
function unlockScroll() {
  if (lockCount > 0 && --lockCount === 0) document.body.style.overflow = ''
}

// show       : getter boolean, contoh () => props.show
// panel      : ref ke elemen dialog
// onClose    : dipanggil saat Escape / klik backdrop
// persistent : getter boolean, true = Escape & backdrop tidak menutup
// initialFocus : selector elemen yang difokuskan pertama kali
export function useDialog(show, panel, { onClose, persistent = () => false, initialFocus = '' } = {}) {
  let lastFocused = null
  let locked = false

  function release() {
    if (locked) {
      unlockScroll()
      locked = false
    }
  }

  watch(
    show,
    async (open) => {
      if (open) {
        lastFocused = document.activeElement
        if (!locked) {
          lockScroll()
          locked = true
        }
        await nextTick()
        const el = panel.value
        if (!el) return
        const target = (initialFocus && el.querySelector(initialFocus)) || el.querySelector(FOCUSABLE) || el
        target.focus()
      } else {
        release()
        lastFocused?.focus?.()
        lastFocused = null
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(release)

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      if (!persistent()) onClose()
      return
    }
    if (e.key !== 'Tab') return

    const items = [...panel.value.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
    if (!items.length) {
      e.preventDefault()
      panel.value.focus()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement

    if (e.shiftKey && (active === first || active === panel.value)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  function onBackdrop() {
    if (!persistent()) onClose()
  }

  return { onKeydown, onBackdrop }
}