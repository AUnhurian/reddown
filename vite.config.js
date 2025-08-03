import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/reddown/' : '/',
  root: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: './index.html'
    }
  },
  server: {
    port: 3000,
    open: true
  }
})