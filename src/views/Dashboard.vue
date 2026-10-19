<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="bg-white rounded-xl shadow-sm p-6 max-w-xl mx-auto">
      <h1 class="text-lg font-semibold capitalize">Dashboard {{ auth.role }}</h1>
      <p class="text-sm text-gray-500 mt-1">
        Halo, {{ auth.user?.name }} ({{ auth.user?.email }})
      </p>

      <button
        class="mt-6 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold"
        @click="handleLogout"
      >
        Keluar
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

async function handleLogout() {
  await auth.logout()
  router.push('/')
}
</script>