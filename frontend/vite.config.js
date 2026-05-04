import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,       // Bind ke 0.0.0.0 agar bisa diakses dari luar Docker container
    port: 5173,
  },
})
