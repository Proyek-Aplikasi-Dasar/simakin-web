import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Dua halaman form (tambah & edit) untuk satu jenis data master.
// Parameter :id di URL otomatis dikirim ke komponen sebagai prop "id".
function masterFormRoutes(type) {
  const component = () => import('../views/admin/MasterFormPage.vue')
  return [
    {
      path: `data-master/${type}/tambah`,
      name: `${type}-tambah`,
      component,
      props: { type },
    },
    {
      path: `data-master/${type}/:id/edit`,
      name: `${type}-edit`,
      component,
      props: (route) => ({ type, id: route.params.id }),
    },
  ]
}

const routes = [
  {
    path: '/',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('../views/ForgotPassword.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, allowedRoles: ['admin'] },
    children: [
      {
        path: '',
        name: 'admin-home',
        component: () => import('../views/admin/AdminDashboard.vue'),
      },
      {
        path: 'master-data/siswa',
        name: 'master-siswa',
        component: () => import('../views/admin/SiswaView.vue'),
      },
      {
        path: 'master-data/perusahaan',
        name: 'master-perusahaan',
        component: () => import('../views/admin/PerusahaanView.vue'),
      },
      {
        path: 'data-master',
        name: 'data-master',
        component: () => import('../views/admin/DataMasterView.vue'),
      },
      ...masterFormRoutes('jurusan'),
      ...masterFormRoutes('kompetensi'),
      {
        path: 'master-data/guru',
        name: 'master-guru',
        component: () => import('../views/admin/GuruView.vue'),
      },
    ],
  },
  {
    path: '/guru',
    name: 'guru-home',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true, allowedRoles: ['guru'] },
  },
  // Alamat tidak dikenal -> kembali ke login (guard akan arahkan ke home kalau sudah login)
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Pengecekan sesi pertama kali (juga setelah refresh halaman)
  if (!auth.ready) {
    await auth.fetchUser()
  }

  // Butuh login tapi belum login
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return '/'
  }

  // Halaman tamu (login, lupa password) tapi sudah login -> ke home sesuai role
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return auth.homePath
  }

  // Role tidak sesuai dengan halaman
  if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(auth.role)) {
    return auth.homePath
  }
})

export default router