import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    role: null,
    token: null,
  }),
  actions: {
    login(userData, userRole, userToken) {
      this.user = userData
      this.role = userRole
      this.token = userToken
    },
    logout() {
      this.user = null
      this.role = null
      this.token = null
    },
  },
})