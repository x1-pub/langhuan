import React from 'react';

import StringEditor from './string-editor';
import HashEditor from './hash-editor';
import ListEditor from './list-editor';
import SetEditor from './set-editor';
import ZSetEditor from './zset-editor';
import StreamEditor from './stream-editor';
import { ERedisDataType, TRedisValue } from '@packages/types/redis';

const typeComponentMap = {
  [ERedisDataType.STRING]: StringEditor,
  [ERedisDataType.HASH]: HashEditor,
  [ERedisDataType.LIST]: ListEditor,
  [ERedisDataType.SET]: SetEditor,
  [ERedisDataType.ZSET]: ZSetEditor,
  [ERedisDataType.STREAM]: StreamEditor,
};

interface ValueEditorProps {
  mode: 'edit' | 'add';
  type: ERedisDataType;
  redisKey?: string;
  value?: TRedisValue;
  onChange?: (value: TRedisValue) => void;
  onReload?: () => void;
}

const ValueEditor: React.FC<ValueEditorProps> = props => {
  const { mode, type, redisKey, value, onChange, onReload } = props;
  const Comp = typeComponentMap[type];

  return (
    <Comp mode={mode} redisKey={redisKey} value={value} onReload={onReload} onChange={onChange} />
  );
};

export default ValueEditor;
