import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import svgr from 'vite-plugin-svgr';

// 统一不同操作系统下的路径分隔符，避免匹配规则失效。
const normalizePath = (id: string) => id.replace(/\\/g, '/');
// 生成稳定且可用于 URL 的 chunk 名称片段。
const toChunkNamePart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Monaco：editor/common 按能力分组。
// 目标是在“单包过大”和“碎片过多”之间取得平衡。
const MONACO_EDITOR_COMMON_GROUPS: Record<string, string> = {
  model: 'model',
  cursor: 'model',
  viewModel: 'model',
  core: 'runtime',
  config: 'runtime',
  services: 'runtime',
  standalone: 'runtime',
  languages: 'language',
  diff: 'language',
  viewLayout: 'language',
  tokens: 'language',
  commands: 'language',
};

// Monaco：browser 层按渲染/交互职责分组。
const MONACO_EDITOR_BROWSER_GROUPS: Record<string, string> = {
  widget: 'render',
  viewParts: 'render',
  gpu: 'render',
  view: 'render',
  controller: 'interaction',
  services: 'interaction',
  config: 'interaction',
};

// Monaco：platform 服务按用途分组。
const MONACO_PLATFORM_GROUPS: Record<string, string> = {
  quickinput: 'ui',
  theme: 'ui',
  actions: 'ui',
  contextview: 'ui',
  keybinding: 'command',
  contextkey: 'command',
  configuration: 'command',
};

// Antd 组件按功能域分组，平衡请求数量与 chunk 体积。
const ANTD_COMPONENT_GROUPS: Record<string, string> = {
  table: 'data',
  tree: 'data',
  descriptions: 'data',
  typography: 'data',
  list: 'data',
  card: 'data',
  skeleton: 'data',
  badge: 'data',
  tag: 'data',
  tabs: 'navigation',
  menu: 'navigation',
  dropdown: 'navigation',
  pagination: 'navigation',
  breadcrumb: 'navigation',
  steps: 'navigation',
  form: 'form',
  input: 'form',
  'input-number': 'form',
  select: 'form',
  checkbox: 'form',
  radio: 'form',
  switch: 'form',
  'date-picker': 'form',
  'time-picker': 'form',
  cascader: 'form',
  'tree-select': 'form',
  mentions: 'form',
  'auto-complete': 'form',
  modal: 'feedback',
  notification: 'feedback',
  message: 'feedback',
  result: 'feedback',
  popconfirm: 'feedback',
  tooltip: 'feedback',
  popover: 'feedback',
  empty: 'feedback',
  spin: 'feedback',
  layout: 'layout',
  grid: 'layout',
  space: 'layout',
  splitter: 'layout',
  divider: 'layout',
  anchor: 'layout',
  theme: 'foundation',
  locale: 'foundation',
  'config-provider': 'foundation',
};

// rc-* 生态按与 Antd 一致的功能域分组。
const RC_PACKAGE_GROUPS: Record<string, string> = {
  picker: 'form',
  select: 'form',
  form: 'form',
  'async-validator': 'form',
  input: 'form',
  textarea: 'form',
  'input-number': 'form',
  table: 'data',
  tree: 'data',
  'virtual-list': 'data',
  pagination: 'data',
  menu: 'navigation',
  tabs: 'navigation',
  dropdown: 'overlay',
  trigger: 'overlay',
  dialog: 'overlay',
  notification: 'overlay',
  motion: 'overlay',
  overflow: 'overlay',
  collapse: 'overlay',
  portal: 'overlay',
  tooltip: 'overlay',
  util: 'core',
};

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

// Monaco 专用拆包策略。
// Monaco 通常是最重依赖，因此拆分粒度比其他 vendor 更细。
const getMonacoChunkName = (id: string) => {
  if (id.includes('/basic-languages/sql/')) {
    return 'vendor-monaco-sql';
  }

  const monacoRootIndex = id.indexOf('/monaco-editor/esm/vs/');
  if (monacoRootIndex !== -1) {
    const subPath = id.slice(monacoRootIndex + '/monaco-editor/esm/vs/'.length);
    const [scope, group, area] = subPath.split('/');
    if (scope === 'base' && group) {
      return `vendor-monaco-base-${toChunkNamePart(group)}`;
    }
    if (scope === 'editor' && group === 'common') {
      const bucket = (area && MONACO_EDITOR_COMMON_GROUPS[area]) || 'runtime';
      return `vendor-monaco-editor-common-${toChunkNamePart(bucket)}`;
    }
    if (scope === 'editor' && group === 'browser') {
      const bucket = (area && MONACO_EDITOR_BROWSER_GROUPS[area]) || 'core';
      return `vendor-monaco-editor-browser-${toChunkNamePart(bucket)}`;
    }
    if (scope === 'editor' && group === 'contrib') {
      return 'vendor-monaco-editor-contrib';
    }
    if (scope === 'editor' && group === 'standalone') {
      return 'vendor-monaco-editor-standalone';
    }
    if (scope === 'platform' && group) {
      const bucket = MONACO_PLATFORM_GROUPS[group] || 'core';
      return `vendor-monaco-platform-${toChunkNamePart(bucket)}`;
    }
    if (scope === 'language') {
      return 'vendor-monaco-language';
    }
    if (scope && group) {
      return `vendor-monaco-${toChunkNamePart(scope)}-${toChunkNamePart(group)}`;
    }
  }

  return 'vendor-monaco-core';
};

// Antd / rc 专用拆包策略。
// 未识别的组件回退到 core chunk，保证依赖小版本变化时也稳定。
const getAntdChunkName = (id: string, packageName: string) => {
  if (packageName === 'antd') {
    const componentMatch = id.match(/\/antd\/es\/([^/]+)\//);
    const componentName = componentMatch?.[1];
    if (!componentName || componentName === '_util' || componentName === 'style') {
      return 'vendor-antd-core';
    }
    const group = ANTD_COMPONENT_GROUPS[componentName];
    if (!group) {
      return 'vendor-antd-core';
    }
    return `vendor-antd-${toChunkNamePart(group)}`;
  }

  if (packageName === 'antd-style') {
    return 'vendor-antd-style';
  }

  if (packageName.startsWith('@rc-component/')) {
    const rcName = packageName.split('/')[1];
    const group = RC_PACKAGE_GROUPS[rcName] || 'core';
    return `vendor-rc-${toChunkNamePart(group)}`;
  }

  if (packageName.startsWith('rc-')) {
    const rcName = packageName.replace(/^rc-/, '');
    const group = RC_PACKAGE_GROUPS[rcName] || 'core';
    return `vendor-rc-${toChunkNamePart(group)}`;
  }

  if (packageName.startsWith('@ant-design/')) {
    return 'vendor-antd-style';
  }

  return 'vendor-antd-core';
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

          // 3) 先匹配重依赖（Monaco），再匹配框架/UI/数据层依赖。
          if (normalized.includes('/node_modules/monaco-editor/')) {
            return getMonacoChunkName(normalized);
          }

          if (
            normalized.includes('/node_modules/@monaco-editor/react/') ||
            normalized.includes('/node_modules/@monaco-editor/loader/')
          ) {
            return 'vendor-monaco-react';
          }

          const packageName = getPackageName(normalized);
          if (!packageName) {
            return 'vendor-misc';
          }

          if (
            packageName === 'react' ||
            packageName === 'react-dom' ||
            packageName === 'react-router' ||
            packageName === 'scheduler'
          ) {
            return 'vendor-react';
          }

          if (packageName.startsWith('@tanstack/') || packageName.startsWith('@trpc/')) {
            return 'vendor-trpc-query';
          }

          if (packageName === 'i18next' || packageName === 'react-i18next') {
            return 'vendor-i18n';
          }

          if (packageName === '@ant-design/icons' || packageName === '@ant-design/icons-svg') {
            return 'vendor-antd-icons';
          }

          if (
            packageName === 'antd' ||
            packageName === 'antd-style' ||
            packageName.startsWith('@ant-design/') ||
            packageName.startsWith('@rc-component/') ||
            packageName.startsWith('rc-')
          ) {
            return getAntdChunkName(normalized, packageName);
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
