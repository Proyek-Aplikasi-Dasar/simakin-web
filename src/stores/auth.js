import { defineStore } from 'pinia'
import api, { getCsrfCookie } from '../services/api'
import { ROLE_MAP, WEB_ROLES, HOME_BY_ROLE } from '../constants/roles'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    role: null,
    ready: false, 
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    homePath: (state) => HOME_BY_ROLE[state.role] ?? '/',
  },

  actions: {
    setUser(user) {
      this.user = user
      this.role = user.role?.nama ?? ROLE_MAP[user.role_id] ?? null
    },

    clear() {
      this.user = null
      this.role = null
    },

    async fetchUser() {
      try {
        const { data } = await api.get('/api/user', { skipAuthRedirect: true })
        this.setUser(data)
        if (!WEB_ROLES.includes(this.role)) {
          await this.logout()
        }
      } catch {
        this.clear()
      } finally {
        this.ready = true
      }
    },

    async login(username, password) {
      await getCsrfCookie()
      const { data } = await api.post('/api/login', { username, password })
      this.setUser(data.user)

      if (!WEB_ROLES.includes(this.role)) {
        await this.logout()
        throw new Error('ROLE_NOT_ALLOWED')
      }
    },

    async logout() {
      try {
        await api.post('/api/logout', null, { skipAuthRedirect: true })
      } catch {
      } finally {
        this.clear()
      }
    },
  },
})