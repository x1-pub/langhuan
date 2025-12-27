import React, { useState } from 'react';
import { DeleteOutlined, PlusCircleOutlined, SaveOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';

import styles from './index.module.less';
import EditableText from '@/components/editable-text';
import { TRedisValue } from '@packages/types/redis';
import useDatabaseWindows from '@/hooks/use-database-windows';
import { trpc } from '@/utils/trpc';

interface ZSetEditorProps {
  mode?: 'add' | 'edit';
  redisKey?: string;
  value?: TRedisValue;
  onChange?: (v: TRedisValue) => void;
  onReload?: () => void;
}

const defaultValue: TRedisValue = [['', '']];

const ZSetEditor: React.FC<ZSetEditorProps> = ({
  redisKey,
  value = defaultValue,
  mode = 'add',
  onChange,
  onReload,
}) => {
  const { t } = useTranslation();
  const [newItem, setNewItem] = useState<TRedisValue>([]);
  const { connectionId, dbName } = useDatabaseWindows();
  const updateZsetValueMutation = useMutation(trpc.redis.updateZsetValue.mutationOptions());

  const handleChange = async (index: number, item: [string, string]) => {
    if (mode === 'add') {
      onChange?.([...value.slice(0, index), item, ...value.slice(index + 1)]);
      return;
    }

    if (index < value.length) {
      await updateZsetValueMutation.mutateAsync({
        connectionId,
        dbName,
        key: redisKey!,
        member: item[0],
        score: Number(item[1]) || 0,
      });
      onReload?.();
      return;
    }

    const idx = index - value.length;
    setNewItem([...newItem.slice(0, idx), item, ...newItem.slice(idx + 1)]);
  };

  const handleAdd = () => {
    if (mode === 'add') {
      onChange?.([...value, ...defaultValue]);
      return;
    }

    setNewItem(v => [...v, ...defaultValue]);
  };

  const handleDelete = async (index: number) => {
    if (index < value.length) {
      await updateZsetValueMutation.mutateAsync({
        connectionId,
        dbName,
        key: redisKey!,
        member: value[index][0],
        isRemove: true,
      });
      onReload?.();
      return;
    }

    setNewItem([
      ...newItem.slice(0, index - value.length),
      ...newItem.slice(index - value.length + 1),
    ]);
  };

  const handleSaveNewItem = async (index: number, item: [string, string]) => {
    await updateZsetValueMutation.mutateAsync({
      connectionId,
      dbName,
      key: redisKey!,
      member: item[0],
      score: Number(item[1]) || 0,
    });
    setNewItem([
      ...newItem.slice(0, index - value.length),
      ...newItem.slice(index - value.length + 1),
    ]);
    onReload?.();
  };

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tr}>
              <td className={styles.td}>{t('table.member')}</td>
              <td className={styles.td}>{t('table.score')}</td>
              <td className={styles.td}>{t('table.operation')}</td>
            </tr>
          </thead>
          <tbody>
            {[...value, ...newItem].map(([member, score], index) => (
              <tr key={index} className={styles.tr}>
                <td className={styles.td}>
                  <EditableText
                    readonly={mode === 'edit' && index < value.length}
                    value={member}
                    editMode={mode === 'add' || index >= value.length ? 'fastify' : 'normal'}
                    onChange={newMember => handleChange(index, [newMember, score])}
                    empty={
                      index >= value.length || mode === 'add' ? t('redis.member') : t('redis.empty')
                    }
                  />
                </td>
                <td className={styles.td} style={{ width: '30%' }}>
                  <EditableText
                    value={score}
                    editMode={mode === 'add' || index >= value.length ? 'fastify' : 'normal'}
                    onChange={newScore => handleChange(index, [member, newScore])}
                    empty={t('redis.score')}
                  />
                </td>
                <td className={classNames(styles.handler, styles.td)}>
                  <DeleteOutlined className={styles.delIcon} onClick={() => handleDelete(index)} />
                  {index >= value.length && (
                    <SaveOutlined
                      className={styles.icon}
                      onClick={() => handleSaveNewItem(index, [member, score])}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.add}>
        <PlusCircleOutlined onClick={handleAdd} />
      </div>
    </>
  );
};

export default ZSetEditor;
