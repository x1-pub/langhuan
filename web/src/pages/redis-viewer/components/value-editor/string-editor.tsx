import React from "react";
import { Input } from "antd";
import { useTranslation } from "react-i18next";

import EditableText from "@/components/editable-text";

interface StringEditorProps {
  value?: string;
  mode?: 'add' | 'edit';
  onChange?: (v: string) => void;
}

const StringEditor: React.FC<StringEditorProps> = ({ value, mode = 'add', onChange }) => {
  const { t } = useTranslation()

  if (mode === 'edit') {
    return (
      <EditableText
        value={value}
        onChange={onChange}
        multiline
        empty={t('redis.empty')}
      />
    )
  }

  return (
    <Input.TextArea
      autoSize={{ minRows: 5 }}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={t('redis.value')}
    />
  )
}

export default StringEditor
