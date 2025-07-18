/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

import * as Monaco from 'monaco-editor';

declare interface Window {
  monaco: typeof Monaco;
  MonacoEnvironment?: {
    getWorker: (moduleId: string, label: string) => string;
  };
}

declare global {
  interface Window {
    monaco: typeof Monaco;
  }
}

declare namespace Monaco {
  export type editor = typeof Monaco.editor;
  export type IStandaloneCodeEditor = Monaco.editor.IStandaloneCodeEditor;
}