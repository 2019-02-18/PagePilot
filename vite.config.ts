import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@pagepilot': resolve(__dirname, 'src/pagepilot'),
      '@host': resolve(__dirname, 'src/host-app'),
      '@sitepack': resolve(__dirname, 'sitepack'),
    },
  },
})
