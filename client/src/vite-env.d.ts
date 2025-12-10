/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

import * as monaco from 'monaco-editor';

declare global {
  interface Window {
    monaco: typeof monaco;
  }
}

export {};
