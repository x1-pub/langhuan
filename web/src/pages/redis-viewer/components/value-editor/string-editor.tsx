import React from "react";
import { Input } from "antd";

import EditableText from "@/components/editable-text";

interface StringEditorProps {
  value?: string;
  mode?: 'add' | 'edit';
  onChange?: (v: string) => void;
}

const StringEditor: React.FC<StringEditorProps> = ({ value, mode = 'add', onChange }) => {
  if (mode === 'edit') {
    return (
      <EditableText
        value={value}
        onChange={onChange}
        multiline
        placeholder="Enter Value"
      />
    )
  }

  return (
    <Input.TextArea
      autoSize={{ minRows: 5 }}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder="Enter Value"
    />
  )
}

export default StringEditor
