import React, { useEffect, useMemo, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { useTranslation } from 'react-i18next';

import { monaco } from './monaco';
import { SQL_FUNCTIONS, SQL_KEYWORDS } from './constants';

loader.config({
  monaco,
});

const SQL_LANGUAGE = 'sql';
const SUGGESTION_TRIGGER_CHARACTERS = Array.from(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.',
);
const EMPTY_SUGGESTIONS: readonly string[] = [];

interface CodeEditorProps {
  theme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  language?: string;
  value?: string;
  readOnly?: boolean;
  showLineNumbers?: boolean;
  fields?: readonly string[];
  keywords?: readonly string[];
  onChange?: (value?: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = props => {
  const { t, i18n } = useTranslation();
  const {
    theme = 'vs',
    language = SQL_LANGUAGE,
    value = '',
    readOnly = false,
    showLineNumbers = true,
    fields = EMPTY_SUGGESTIONS,
    keywords = EMPTY_SUGGESTIONS,
    onChange,
  } = props;

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const completionProviderRef = useRef<Monaco.IDisposable | null>(null);
  const focusListenerRef = useRef<Monaco.IDisposable | null>(null);

  const keywordSuggestions = useMemo(
    () => Array.from(new Set([...SQL_KEYWORDS, ...keywords])),
    [keywords],
  );
  const functionSuggestions = useMemo(
    () =>
      SQL_FUNCTIONS.map(func => ({
        ...func,
        detail: t(func.detailKey),
        documentation: t(func.documentationKey),
      })),
    [t, i18n.language],
  );

  const registerCompletionProvider = (monacoInstance: typeof Monaco) => {
    if (completionProviderRef.current) {
      completionProviderRef.current.dispose();
      completionProviderRef.current = null;
    }

    if (readOnly || language !== SQL_LANGUAGE) {
      return;
    }

    completionProviderRef.current = monacoInstance.languages.registerCompletionItemProvider(
      SQL_LANGUAGE,
      {
        triggerCharacters: SUGGESTION_TRIGGER_CHARACTERS,
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const suggestions: Monaco.languages.CompletionItem[] = [
            ...keywordSuggestions.map(keyword => ({
              label: keyword,
              kind: monacoInstance.languages.CompletionItemKind.Keyword,
              insertText: keyword,
              range,
              detail: t('codeEditor.detail.sqlKeyword'),
            })),
            ...functionSuggestions.map(func => ({
              label: func.name,
              kind: monacoInstance.languages.CompletionItemKind.Function,
              insertText: func.insertText,
              range,
              detail: func.detail,
              documentation: func.documentation,
              insertTextRules:
                monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            })),
            ...fields.map(field => ({
              label: field,
              kind: monacoInstance.languages.CompletionItemKind.Field,
              insertText: field,
              range,
              detail: t('codeEditor.detail.tableField'),
            })),
          ];

          return { suggestions };
        },
      },
    );
  };

  const handleEditorDidMount = (
    editor: Monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof Monaco,
  ) => {
    editorRef.current = editor;
    registerCompletionProvider(monacoInstance);

    if (language === SQL_LANGUAGE) {
      monacoInstance.languages.setLanguageConfiguration(SQL_LANGUAGE, {
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
    }

    if (!readOnly) {
      const triggerSuggest = () => {
        const suggestAction = editor.getAction('editor.action.triggerSuggest');
        if (!suggestAction) {
          return;
        }

        void suggestAction.run().catch(() => undefined);
      };

      editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Space, () => {
        triggerSuggest();
      });

      if (focusListenerRef.current) {
        focusListenerRef.current.dispose();
      }
      focusListenerRef.current = editor.onDidFocusEditorText(() => {
        triggerSuggest();
      });
    }
  };

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    registerCompletionProvider(monaco);
  }, [fields, i18n.language, keywordSuggestions, functionSuggestions, language, readOnly]);

  useEffect(() => {
    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
      }
      if (focusListenerRef.current) {
        focusListenerRef.current.dispose();
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
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false,
        },
        suggestOnTriggerCharacters: true,
      }}
    />
  );
};

export default CodeEditor;
