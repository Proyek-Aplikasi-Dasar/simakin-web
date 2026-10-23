import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

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
        component: () => import('../views/admin/SiswaListView.vue'),
      },
      {
        path: 'master-data/siswa/tambah',
        name: 'siswa-tambah',
        component: () => import('../views/admin/SiswaFormPage.vue'),
      },
      {
        path: 'data-master/perusahaan/tambah',
        name: 'perusahaan-tambah',
        component: () => import('../views/admin/PerusahaanFormPage.vue'),
      },
      {
        path: 'data-master/perusahaan/:id',
        name: 'perusahaan-detail',
        component: () => import('../views/admin/PerusahaanDetailPage.vue'),
        props: true,
      },
      {
        path: 'data-master/perusahaan/:id/edit',
        name: 'perusahaan-edit',
        component: () => import('../views/admin/PerusahaanFormPage.vue'),
        props: true,
      },
      {
        path: 'pengajuan-pkl',
        name: 'pengajuan-pkl',
        component: () => import('../views/admin/PengajuanPklView.vue'),
      },
      {
        path: 'export-import',
        name: 'export-import',
        component: () => import('../views/admin/ExportImportPage.vue'),
      },
      {
        path: 'pengaturan',
        name: 'pengaturan',
        component: () => import('../views/admin/PengaturanSistemView.vue'),
      },
      {
        path: 'data-master',
        name: 'data-master',
        component: () => import('../views/admin/DataMasterView.vue'),
      },
      ...masterFormRoutes('jurusan'),
      ...masterFormRoutes('kompetensi'),
      ...masterFormRoutes('gelombang'),
      ...masterFormRoutes('sikap'),
      {
        path: 'master-data/guru',
        name: 'master-guru',
        component: () => import('../views/admin/GuruListView.vue'),
      },
      {
        path: 'master-data/guru/tambah',
        name: 'guru-tambah',
        component: () => import('../views/admin/GuruFormPage.vue'),
      },
    ],
  },
  {
    path: '/guru',
    name: 'guru-home',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true, allowedRoles: ['guru'] },
  },
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