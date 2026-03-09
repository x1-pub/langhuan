import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@packages': path.resolve(__dirname, '../packages'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 7201,
    proxy: {
      '/api/trpc': {
        target: 'http://127.0.0.1:7209',
        changeOrigin: false,
      },
    },
  },
});
