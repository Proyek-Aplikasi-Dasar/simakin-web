import { defineStore } from 'pinia'

let nextId = 1
const timers = new Map()
const MAX_TOASTS = 4

export const useToastStore = defineStore('toast', {
  state: () => ({ items: [] }),

  actions: {
    show(message, type = 'success', duration = 3000) {
      if (!message) return null

      const dup = this.items.find((t) => t.message === message && t.type === type)
      if (dup) {
        this.schedule(dup.id, duration)
        return dup.id
      }

      const id = nextId++
      this.items.push({ id, message, type })
      if (this.items.length > MAX_TOASTS) this.dismiss(this.items[0].id)
      this.schedule(id, duration)
      return id
    },

    schedule(id, duration) {
      clearTimeout(timers.get(id))
      if (duration > 0) {
        timers.set(id, setTimeout(() => this.dismiss(id), duration))
      }
    },

    dismiss(id) {
      clearTimeout(timers.get(id))
      timers.delete(id)
      this.items = this.items.filter((t) => t.id !== id)
    },

    success(message, duration) { return this.show(message, 'success', duration) },
    error(message, duration = 5000) { return this.show(message, 'error', duration) },
    warning(message, duration) { return this.show(message, 'warning', duration) },
    info(message, duration) { return this.show(message, 'info', duration) },
  },
})