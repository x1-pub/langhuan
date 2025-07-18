import { Monaco } from "@/vite-env";
import React, { useEffect, useRef } from "react";

interface CodeEditorProps {
  theme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  language?: string;
  value?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = (props) => {
  const { theme = 'vs', language = 'sql', value = '', readOnly = false, onChange } = props
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<Monaco.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    monacoEditorRef.current?.setValue(value)
  }, [value])

  useEffect(() => {
    if (!monacoEditorRef.current) {
      return
    }

    const model = monacoEditorRef.current.getModel();
    if (model) {
      window.monaco.editor.setModelLanguage(model, language);
    }
  }, [language])

  useEffect(() => {
    if (monacoEditorRef.current) {
      monacoEditorRef.current.updateOptions({ readOnly, theme });
    }
  }, [readOnly, theme]);

  useEffect(() => {
    if (!editorRef.current || !window?.monaco) {
      return
    }

    monacoEditorRef.current = window.monaco.editor.create(editorRef.current, {
      value,
      theme,
      language,
      readOnly,
      scrollbar: {
        verticalScrollbarSize: 8,
        horizontalSliderSize: 5,
      },
    })

    const changeListener = monacoEditorRef.current.onDidChangeModelContent(() => {
      const value = monacoEditorRef.current?.getValue() || '';
      onChange?.(value);
    });

    return () => {
      changeListener.dispose();
      monacoEditorRef.current?.dispose()
    };
  }, [editorRef.current])
  
  return (
    <div style={{ height: '100%' }} ref={editorRef}></div>
  )
}

export default CodeEditor