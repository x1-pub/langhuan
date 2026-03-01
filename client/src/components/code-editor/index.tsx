import React, { useEffect, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { useTranslation } from 'react-i18next';

import { monaco } from './monaco';
import { SQL_FUNCTIONS, SQL_KEYWORDS } from './constants';

loader.config({
  monaco,
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
  const { t, i18n } = useTranslation();
  const {
    theme = 'vs',
    language = 'sql',
    value = '',
    readOnly = false,
    showLineNumbers = true,
    fields = [],
    onChange,
  } = props;

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const completionProviderRef = useRef<Monaco.IDisposable | null>(null);

  const registerCompletionProvider = (monacoInstance: typeof Monaco) => {
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

        const suggestions: Monaco.languages.CompletionItem[] = [
          ...SQL_KEYWORDS.map(keyword => ({
            label: keyword,
            kind: monacoInstance.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range,
            detail: t('codeEditor.detail.sqlKeyword'),
          })),
          ...SQL_FUNCTIONS.map(func => ({
            label: func.name,
            kind: monacoInstance.languages.CompletionItemKind.Function,
            insertText: func.insertText,
            range: range,
            detail: t(func.detailKey),
            documentation: t(func.documentationKey),
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          })),
          ...fields.map(field => ({
            label: field,
            kind: monacoInstance.languages.CompletionItemKind.Field,
            insertText: field,
            range: range,
            detail: t('codeEditor.detail.tableField'),
          })),
        ];

        return { suggestions };
      },
    });
  };

  const handleEditorDidMount = (
    editor: Monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof Monaco,
  ) => {
    editorRef.current = editor;

    registerCompletionProvider(monacoInstance);

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
    if (!editorRef.current) {
      return;
    }

    let disposed = false;
    void loader.init().then(monacoInstance => {
      if (!disposed) {
        registerCompletionProvider(monacoInstance);
      }
    });

    return () => {
      disposed = true;
    };
  }, [fields, i18n.language]);

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
