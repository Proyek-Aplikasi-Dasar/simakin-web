import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', component: Login },
  { path: '/register', component: Register },
  { 
    path: '/dashboard', 
    component: Dashboard,
    meta: { requiresAuth: true, allowedRoles: ['siswa', 'guru', 'admin'] }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.user) {
    next('/')
    return
  }

  if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(authStore.role)) {
    next('/')
    return
  }

  next()
})

export default router