import React from "react";

import { RedisType } from "@/api/redis";
import { Input } from "antd";
import StringEditor from "./string-editor";
import HashEditor from "./hash-editor";
import ListEditor from "./list-editor";
import SetEditor from "./set-editor";
import ZSetEditor from "./zset-editor";

interface ValueEditorProps {
  type: RedisType
  value?: any;
  onChange?: (v: any) => void;
}

const ValueEditor: React.FC<ValueEditorProps> = ({ type, value, onChange }) => {
  if (type === RedisType.STRING) {
    return <StringEditor value={value} onChange={onChange} />
  }
  if (type === RedisType.HASH) {
    return <HashEditor value={value} onChange={onChange} />
  }
  if (type === RedisType.LIST) {
    return <ListEditor value={value} onChange={onChange} />
  }
  if (type === RedisType.SET) {
    return <SetEditor value={value} onChange={onChange} />
  }
  if (type === RedisType.ZSET) {
    return <ZSetEditor value={value} onChange={onChange} />
  }

  return <Input.TextArea autoSize={{ minRows: 5 }} value={value} onChange={(e) => onChange?.(e.target.value)} />
}

export default ValueEditor
