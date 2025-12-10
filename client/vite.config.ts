import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
      '@packages': path.join(__dirname, '../packages'),
    },
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          monaco: ['monaco-editor', '@monaco-editor/react'],
        },
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 7201,
    proxy: {
      '/dev-api': {
        target: 'http://127.0.0.1:7202/',
        changeOrigin: false,
        rewrite: path => path.replace(/^\/dev-api/, ''),
      },
    },
  },
});
