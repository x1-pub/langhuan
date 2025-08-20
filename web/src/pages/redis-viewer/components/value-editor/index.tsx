import React from "react";

import { RedisType } from "@/api/redis";
import { Input } from "antd";
import StringEditor from "./string-editor";
import HashEditor from "./hash-editor";
import ListEditor from "./list-editor";
import SetEditor from "./set-editor";
import ZSetEditor from "./zset-editor";

interface ValueEditorProps {
  type: RedisType;
  mode?: 'add' | 'edit';
  value?: any;
  onChange?: (v: any) => void;
}

const ValueEditor: React.FC<ValueEditorProps> = ({ type, mode = 'add', value, onChange }) => {
  if (type === RedisType.STRING) {
    return <StringEditor mode={mode} value={value} onChange={onChange} />
  }
  if (type === RedisType.HASH) {
    return <HashEditor mode={mode} value={value} onChange={onChange} />
  }
  if (type === RedisType.LIST) {
    return <ListEditor mode={mode} value={value} onChange={onChange} />
  }
  if (type === RedisType.SET) {
    return <SetEditor mode={mode} value={value} onChange={onChange} />
  }
  if (type === RedisType.ZSET) {
    return <ZSetEditor mode={mode} value={value} onChange={onChange} />
  }

  return <Input.TextArea autoSize={{ minRows: 5 }} value={value} onChange={(e) => onChange?.(e.target.value)} />
}

export default ValueEditor
