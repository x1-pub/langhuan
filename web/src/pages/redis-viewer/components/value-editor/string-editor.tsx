import React from "react";

import EditableText from "@/components/editable-text";

interface StringEditorProps {
  value?: string;
  mode?: 'add' | 'edit';
  onChange?: (v: string) => void;
}

const StringEditor: React.FC<StringEditorProps> = ({ value, onChange }) => {
  return (
    <EditableText value={value} onChange={onChange} multiline placeholder="Enter Value" />
  )
}

export default StringEditor
