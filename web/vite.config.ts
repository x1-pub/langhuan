import { defineConfig } from 'vite'
import path from 'path';
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      external: ['monaco-editor'],
    },
  },
  server: {
    host: '127.0.0.1',
    port: 7201,
    proxy: {
      '/dev-api': {
        target: 'http://127.0.0.1:7202/',
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/dev-api/, '')
      },
    }
  }
})
