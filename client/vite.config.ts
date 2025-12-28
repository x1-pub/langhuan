import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import svgr from 'vite-plugin-svgr';
import pkg from './package.json';

const monacoEditorVersion = (pkg.dependencies?.['monaco-editor'] ?? '0.0.0').replace(
  /[^0-9A-Za-z.-]/g,
  '',
);
const monacoReactVersion = (pkg.dependencies?.['@monaco-editor/react'] ?? '0.0.0').replace(
  /[^0-9A-Za-z.-]/g,
  '',
);

let base = '/';

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    {
      name: 'monaco-prefetch',
      configResolved(resolved) {
        base = resolved.base ?? '/';
      },
      transformIndexHtml() {
        const hrefEditor = `${base}assets/monaco-editor-v${monacoEditorVersion}.js`;
        const hrefReact = `${base}assets/monaco-editor-react-v${monacoReactVersion}.js`;
        return [
          {
            tag: 'link',
            attrs: { rel: 'prefetch', as: 'script', href: hrefEditor },
            injectTo: 'head',
          },
          {
            tag: 'link',
            attrs: { rel: 'prefetch', as: 'script', href: hrefReact },
            injectTo: 'head',
          },
        ];
      },
    },
    {
      name: 'strip-monaco-preload',
      transformIndexHtml(html) {
        return html
          .replace(/<link rel="modulepreload"[^>]*monaco-editor[^>]*>\s*/g, '')
          .replace(/<link rel="stylesheet"[^>]*monaco-editor[^>]*>\s*/g, '');
      },
    },
  ],
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
          [`monaco-editor-v${monacoEditorVersion}`]: ['monaco-editor'],
          [`monaco-editor-react-v${monacoReactVersion}`]: ['@monaco-editor/react'],
        },
        chunkFileNames: chunkInfo => {
          if (
            chunkInfo.name.startsWith('monaco-editor-v') ||
            chunkInfo.name.startsWith('monaco-editor-react-v')
          ) {
            return `assets/${chunkInfo.name}.js`;
          }
          return 'assets/[name].js';
        },
      },
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
