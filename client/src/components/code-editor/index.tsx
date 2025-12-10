import React, { useEffect, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

import { SQL_FUNTIONS, SQL_KEYWORDS } from './constants';

loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs',
  },
});

interface CodeEditorProps {
  theme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  language?: string;
  value?: string;
  readOnly?: boolean;
  showLineNumbers?: boolean;
  fields?: string[];
  onChange?: (value?: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = props => {
  const {
    theme = 'vs',
    language = 'sql',
    value = '',
    readOnly = false,
    showLineNumbers = true,
    fields = [],
    onChange,
  } = props;

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const completionProviderRef = useRef<monaco.IDisposable | null>(null);

  const registerCompletionProvider = (monacoInstance: typeof monaco) => {
    if (completionProviderRef.current) {
      completionProviderRef.current.dispose();
    }

    completionProviderRef.current = monacoInstance.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: monaco.languages.CompletionItem[] = [
          // SQL关键字
          ...SQL_KEYWORDS.map(keyword => ({
            label: keyword,
            kind: monacoInstance.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range,
            detail: 'SQL关键字',
          })),
          // SQL函数
          ...SQL_FUNTIONS.map(func => ({
            label: func.name,
            kind: monacoInstance.languages.CompletionItemKind.Function,
            insertText: func.insertText,
            range: range,
            detail: func.detail,
            documentation: func.documentation,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          })),
          // 动态字段
          ...fields.map(field => ({
            label: field,
            kind: monacoInstance.languages.CompletionItemKind.Field,
            insertText: field,
            range: range,
            detail: '表字段',
          })),
        ];

        return { suggestions };
      },
    });
  };

  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco,
  ) => {
    editorRef.current = editor;

    // 初始注册智能提示Provider
    registerCompletionProvider(monacoInstance);

    // 设置SQL语言配置
    monacoInstance.languages.setLanguageConfiguration('sql', {
      comments: {
        lineComment: '--',
        blockComment: ['/*', '*/'],
      },
      brackets: [
        ['(', ')'],
        ['[', ']'],
      ],
      autoClosingPairs: [
        { open: '(', close: ')' },
        { open: '[', close: ']' },
        { open: "'", close: "'" },
        { open: '"', close: '"' },
      ],
      surroundingPairs: [
        { open: '(', close: ')' },
        { open: '[', close: ']' },
        { open: "'", close: "'" },
        { open: '"', close: '"' },
      ],
    });
  };

  useEffect(() => {
    if (editorRef.current) {
      if (window.monaco) {
        registerCompletionProvider(window.monaco);
      }
    }
  }, [fields]);

  useEffect(() => {
    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
      }
    };
  }, []);

  return (
    <Editor
      language={language}
      value={value}
      theme={theme}
      onChange={onChange}
      onMount={handleEditorDidMount}
      options={{
        readOnly,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: showLineNumbers ? 'on' : 'off',
        glyphMargin: false,
        folding: true,
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 3,
        renderLineHighlight: 'line',
        automaticLayout: true,
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
        tabSize: 2,
        insertSpaces: true,
      }}
    />
  );
};

export default CodeEditor;
