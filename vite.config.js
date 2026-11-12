import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/sanctum': 'http://localhost:8000',
      // foto presensi dari BE berupa path relatif /storage/...
      '/storage': 'http://localhost:8000',
    },
    watch: {
      ignored: ['**/*.zip'],
    },
  },
})