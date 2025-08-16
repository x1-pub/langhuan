import React from "react";
import Editor, { loader } from "@monaco-editor/react"

import { loadPath } from "./preload";

loader.config({
  paths: {
    vs: loadPath,
  },
})

interface CodeEditorProps {
  theme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  language?: string;
  value?: string;
  readOnly?: boolean;
  onChange?: (value?: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = (props) => {
  const { theme = 'vs', language = 'sql', value = '', readOnly = false, onChange } = props

  return (
    <Editor
      language={language}
      value={value}
      onChange={onChange}
      theme={theme}
      options={{
        readOnly,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: "on",
        glyphMargin: false,
        folding: true,
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 3,
        renderLineHighlight: "line",
        automaticLayout: true,
        wordWrap: "on",
        formatOnPaste: true,
        formatOnType: true,
        tabSize: 2,
        insertSpaces: true,
      }}
    />
  )
}

export default CodeEditor