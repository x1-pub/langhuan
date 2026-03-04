import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import svgr from 'vite-plugin-svgr';

// 统一不同操作系统下的路径分隔符，避免匹配规则失效。
const normalizePath = (id: string) => id.replace(/\\/g, '/');

// 从模块 id 中提取 npm 包名。
const getPackageName = (id: string) => {
  const normalized = normalizePath(id);
  const nodeModulesIndex = normalized.lastIndexOf('/node_modules/');
  if (nodeModulesIndex === -1) {
    return null;
  }

  const packagePath = normalized.slice(nodeModulesIndex + '/node_modules/'.length);
  const [scopeOrName, name] = packagePath.split('/');
  if (!scopeOrName) {
    return null;
  }

  if (scopeOrName.startsWith('@') && name) {
    return `${scopeOrName}/${name}`;
  }

  return scopeOrName;
};

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    {
      // Monaco 可能注入 preload/style 提示，导致首页过早拉取重资源。
      // 这里移除这些提示，由路由级预加载策略统一控制加载时机。
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
    target: 'es2020',
    cssCodeSplit: true,
    commonjsOptions: {
      // 尽量避免跨 chunk 提取 interop helper，减少初始化环依赖。
      requireReturnsDefault: 'preferred',
    },
    // 预加载由应用层（home-entry）手动调度，这里关闭 Vite 默认 modulepreload。
    modulePreload: false,
    rollupOptions: {
      external: [],
      output: {
        manualChunks(id) {
          // 1) 预加载辅助模块固定拆成独立小 chunk。
          const normalized = normalizePath(id);

          if (normalized.includes('preload-helper')) {
            return 'preload-helper';
          }

          // 2) 业务代码沿用路由/懒加载边界拆分；这里只手动处理 vendor 分组。
          if (!normalized.includes('/node_modules/')) {
            return undefined;
          }

          // 3) Monaco 存在较多平台层循环依赖，拆得过细会触发初始化顺序问题。
          // 统一收敛到单 chunk，优先保证生产环境稳定性。
          if (
            normalized.includes('/node_modules/monaco-editor/') ||
            normalized.includes('/node_modules/@monaco-editor/react/') ||
            normalized.includes('/node_modules/@monaco-editor/loader/')
          ) {
            return 'vendor-monaco';
          }

          const packageName = getPackageName(normalized);
          if (!packageName) {
            return 'vendor-misc';
          }

          if (packageName.startsWith('@tanstack/') || packageName.startsWith('@trpc/')) {
            return 'vendor-trpc-query';
          }

          if (packageName === 'i18next' || packageName === 'react-i18next') {
            return 'vendor-i18n';
          }

          // React + Router + Antd 生态聚合到同一 vendor，避免初始化环依赖。
          if (
            packageName === 'react' ||
            packageName === 'react-dom' ||
            packageName === 'scheduler' ||
            packageName === 'react-router' ||
            packageName === '@remix-run/router' ||
            packageName === 'antd' ||
            packageName === 'antd-style' ||
            packageName.startsWith('@ant-design/') ||
            packageName.startsWith('@rc-component/') ||
            packageName.startsWith('rc-') ||
            packageName.startsWith('@emotion/') ||
            packageName === 'hoist-non-react-statics' ||
            packageName === 'react-is' ||
            packageName === 'is-mobile' ||
            packageName.startsWith('@babel/runtime')
          ) {
            return 'vendor-framework';
          }

          if (packageName.startsWith('@dnd-kit/')) {
            return 'vendor-dnd-kit';
          }

          if (packageName === 'lodash' || packageName === 'uuid' || packageName === 'classnames') {
            return 'vendor-utils';
          }

          if (packageName === 'dayjs') {
            return 'vendor-dayjs';
          }

          if (packageName === 'zod') {
            return 'vendor-zod';
          }

          // 4) 未分类依赖统一进入兜底 chunk。
          return 'vendor-misc';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
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
