import { Input } from "antd";
import React from "react";

interface StringEditorProps {
  value?: string;
  onChange?: (v: string) => void;
}

const StringEditor: React.FC<StringEditorProps> = ({ value, onChange }) => {
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
