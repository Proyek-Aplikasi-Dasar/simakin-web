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
        path: 'master-data/siswa/:id',
        name: 'siswa-detail',
        component: () => import('../views/admin/SiswaDetailPage.vue'),
        props: true,
      },
      {
        path: 'master-data/siswa/:id/edit',
        name: 'siswa-edit',
        component: () => import('../views/admin/SiswaFormPage.vue'),
        props: true,
      },
      {
        path: 'master-data/siswa/:id/presensi',
        name: 'siswa-presensi',
        component: () => import('../views/admin/SiswaPresensiPage.vue'),
        props: true,
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
        path: 'pengajuan-pkl/:id',
        name: 'pengajuan-verifikasi',
        component: () => import('../views/admin/PengajuanPklVerifikasiPage.vue'),
        props: true,
      },
      {
        path: 'lokasi-penempatan',
        name: 'lokasi-penempatan',
        component: () => import('../views/admin/LokasiPenempatanView.vue'),
      },
      {
        path: 'lokasi-penempatan/tambah',
        name: 'lokasi-tambah',
        component: () => import('../views/admin/LokasiFormPage.vue'),
      },
      {
        path: 'lokasi-penempatan/penempatan/:id/edit',
        name: 'lokasi-penempatan-edit',
        component: () => import('../views/admin/LokasiFormPage.vue'),
        props: true,
      },
      {
        path: 'lokasi-penempatan/:id',
        name: 'lokasi-detail',
        component: () => import('../views/admin/LokasiDetailPage.vue'),
        props: true,
      },
            {
        path: 'presensi-siswa',
        name: 'presensi-siswa',
        component: () => import('../views/admin/PresensiSiswaView.vue'),
      },
      {
        path: 'presensi-siswa/tambah',
        name: 'presensi-tambah',
        component: () => import('../views/admin/PresensiSiswaFormPage.vue'),
      },
      {
        path: 'presensi-siswa/belum/:siswaId',
        name: 'presensi-belum',
        component: () => import('../views/admin/PresensiSiswaDetailPage.vue'),
        props: true,
      },
      {
        path: 'presensi-siswa/:id',
        name: 'presensi-detail',
        component: () => import('../views/admin/PresensiSiswaDetailPage.vue'),
        props: true,
      },
      {
        path: 'presensi-siswa/:id/edit',
        name: 'presensi-edit',
        component: () => import('../views/admin/PresensiSiswaFormPage.vue'),
        props: true,
      },
            {
        path: 'jurnal-harian',
        name: 'jurnal-harian',
        component: () => import('../views/admin/JurnalHarianView.vue'),
      },
      {
        path: 'jurnal-harian/tambah',
        name: 'jurnal-tambah',
        component: () => import('../views/admin/JurnalHarianFormPage.vue'),
      },
      {
        path: 'jurnal-harian/belum/:siswaId',
        name: 'jurnal-belum',
        component: () => import('../views/admin/JurnalHarianDetailPage.vue'),
        props: true,
      },
      {
        path: 'jurnal-harian/:id',
        name: 'jurnal-detail',
        component: () => import('../views/admin/JurnalHarianDetailPage.vue'),
        props: true,
      },
      {
        path: 'jurnal-harian/:id/edit',
        name: 'jurnal-edit',
        component: () => import('../views/admin/JurnalHarianFormPage.vue'),
        props: true,
      },
      {
        path: 'rekap-presensi-jurnal',
        name: 'admin-rekap-presensi-jurnal',
        component: () => import('../views/admin/RekapPresensiJurnalView.vue'),
      },
      {
        path: 'penilaian',
        name: 'penilaian',
        component: () => import('../views/admin/PenilaianView.vue'),
      },
      {
        path: 'penilaian/:siswaId',
        name: 'penilaian-detail',
        component: () => import('../views/admin/PenilaianDetailPage.vue'),
        props: true,
      },
      {
        path: 'penilaian/:siswaId/bulan/:bulan/isi',
        name: 'penilaian-bulanan-isi',
        component: () => import('../views/admin/PenilaianBulananFormPage.vue'),
        props: (route) => ({ ...route.params, periode: String(route.query.periode ?? ''), mode: 'isi' }),
      },
      {
        path: 'penilaian/:siswaId/bulan/:bulan/edit',
        name: 'penilaian-bulanan-edit',
        component: () => import('../views/admin/PenilaianBulananFormPage.vue'),
        props: (route) => ({ ...route.params, periode: String(route.query.periode ?? ''), mode: 'edit' }),
      },
      {
        path: 'penilaian/:siswaId/nilai-akhir',
        name: 'nilai-akhir-isi',
        component: () => import('../views/admin/NilaiAkhirFormPage.vue'),
        props: (route) => ({ ...route.params, mode: 'isi' }),
      },
      {
        path: 'penilaian/:siswaId/nilai-akhir/edit',
        name: 'nilai-akhir-edit',
        component: () => import('../views/admin/NilaiAkhirFormPage.vue'),
        props: (route) => ({ ...route.params, mode: 'edit' }),
      },
      {
        path: 'notifikasi',
        name: 'notifikasi',
        component: () => import('../views/admin/NotifikasiView.vue'),
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
            {
        path: 'akun-peran',
        name: 'akun-peran',
        component: () => import('../views/admin/AkunPeranView.vue'),
      },
      {
        path: 'akun-peran/tambah',
        name: 'akun-tambah',
        component: () => import('../views/admin/AkunFormPage.vue'),
      },
      {
        path: 'akun-peran/:id/edit',
        name: 'akun-edit',
        component: () => import('../views/admin/AkunFormPage.vue'),
        props: true,
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
      {
        path: 'master-data/guru/:id',
        name: 'guru-detail',
        component: () => import('../views/admin/GuruDetailPage.vue'),
        props: true,
      },
      {
        path: 'master-data/guru/:id/edit',
        name: 'guru-edit',
        component: () => import('../views/admin/GuruFormPage.vue'),
        props: true,
      },
    ],
  },
  {
    path: '/guru',
    component: () => import('../layouts/GuruLayout.vue'),
    meta: { requiresAuth: true, allowedRoles: ['guru'] },
    children: [
      {
        path: '',
        name: 'guru-home',
        component: () => import('../views/Dashboard.vue'),
      },
      {
        path: 'presensi-siswa',
        name: 'guru-presensi-siswa',
        component: () => import('../views/guru/PresensiSiswaView.vue'),
      },
      {
        path: 'presensi-siswa/siswa/:id',
        name: 'guru-presensi-riwayat',
        component: () => import('../views/guru/RiwayatPresensiSiswaPage.vue'),
        props: true,
      },
      {
        path: 'presensi-siswa/belum/:siswaId',
        name: 'guru-presensi-belum',
        component: () => import('../views/guru/PresensiSiswaDetailPage.vue'),
        props: true,
      },
      {
        path: 'presensi-siswa/:id',
        name: 'guru-presensi-detail',
        component: () => import('../views/guru/PresensiSiswaDetailPage.vue'),
        props: true,
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.ready) {
    await auth.fetchUser()
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return '/'
  }

  if (to.meta.guestOnly && auth.isLoggedIn) {
    return auth.homePath
  }

  if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(auth.role)) {
    return auth.homePath
  }
})

export default router