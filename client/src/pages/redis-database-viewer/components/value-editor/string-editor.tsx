import React from 'react';
import { Input } from 'antd';
import { useTranslation } from 'react-i18next';

import EditableText from '@/components/editable-text';
import { TRedisValue } from '@packages/types/redis';
import { trpc } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';
import useDatabaseWindows from '@/hooks/use-database-windows';

interface StringEditorProps {
  mode: 'add' | 'edit';
  redisKey?: string;
  value?: TRedisValue;
  onChange?: (v: TRedisValue) => void;
  onReload?: () => void;
}

const StringEditor: React.FC<StringEditorProps> = ({
  redisKey,
  value = [['']],
  mode,
  onChange,
  onReload,
}) => {
  const v = value[0][0];
  const { connectionId, dbName } = useDatabaseWindows();
  const { t } = useTranslation();
  const updateStringValueMutation = useMutation(trpc.redis.updateStringValue.mutationOptions());

  const handleModufyValue = async (v: string) => {
    await updateStringValueMutation.mutateAsync({
      connectionId,
      dbName,
      key: redisKey!,
      value: v,
    });
    onReload?.();
  };

  if (mode === 'edit') {
    return (
      <EditableText value={v} onChange={handleModufyValue} multiline empty={t('redis.empty')} />
    );
  }

  return (
    <Input.TextArea
      autoSize={{ minRows: 5 }}
      value={v}
      onChange={e => onChange?.([[e.target.value]])}
      placeholder={t('redis.value')}
    />
  );
};

export default StringEditor;
