<template>
  <h1>Halaman Login</h1>
  <button @click="loginSebagaiSiswa">Login sebagai Siswa (contoh)</button>
  <p v-if="authStore.user">Sedang login sebagai: {{ authStore.role }}</p>
  <router-link to="/dashboard">Ke Dashboard</router-link>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

function loginSebagaiSiswa() {
  authStore.login({ name: 'Sekar' }, 'siswa')
}
</script>