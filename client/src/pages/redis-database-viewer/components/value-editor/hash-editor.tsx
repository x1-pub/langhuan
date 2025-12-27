import React, { useState } from 'react';
import { DeleteOutlined, PlusCircleOutlined, SaveOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';

import EditableText from '@/components/editable-text';
import styles from './index.module.less';
import { trpc } from '@/utils/trpc';
import { TRedisValue } from '@packages/types/redis';
import useDatabaseWindows from '@/hooks/use-database-windows';

interface HashEditorProps {
  mode: 'add' | 'edit';
  redisKey?: string;
  value?: TRedisValue;
  onChange?: (value: TRedisValue) => void;
  onReload?: () => void;
}

const defaultValue: TRedisValue = [['', '']];

const HashEditor: React.FC<HashEditorProps> = ({
  redisKey,
  value = defaultValue,
  mode,
  onChange,
  onReload,
}) => {
  const { connectionId, dbName } = useDatabaseWindows();
  const { t } = useTranslation();
  const [newItem, setNewItem] = useState<TRedisValue>([]);
  const updateHashValueMutation = useMutation(trpc.redis.updateHashValue.mutationOptions());

  const handleChange = async (idx: number, f: string, v: string) => {
    if (mode === 'add') {
      onChange?.([...value.slice(0, idx), [f, v], ...value.slice(idx + 1)]);
      return;
    }

    if (idx < value.length) {
      await updateHashValueMutation.mutateAsync({
        connectionId,
        dbName,
        key: redisKey!,
        field: f,
        value: v,
      });
      onReload?.();
      return;
    }

    const index = idx - value.length;
    setNewItem([...newItem.slice(0, index), [f, v], ...newItem.slice(index + 1)]);
  };

  const handleAddNewItem = () => {
    if (mode === 'edit') {
      setNewItem(v => [...v, ...defaultValue]);
      return;
    }

    onChange?.([...value, ...defaultValue]);
  };

  const handleDeleteItem = async (idx: number, field: string) => {
    if (idx < value.length) {
      await updateHashValueMutation.mutateAsync({
        connectionId,
        dbName,
        key: redisKey!,
        field,
        value: '',
        isRemove: true,
      });
      onReload?.();
      return;
    }

    setNewItem([...newItem.slice(0, idx - value.length), ...newItem.slice(idx - value.length + 1)]);
  };

  const handleSaveNewItem = async (idx: number, f: string, v: string) => {
    await updateHashValueMutation.mutateAsync({
      connectionId,
      dbName,
      key: redisKey!,
      field: f,
      value: v,
    });
    setNewItem([...newItem.slice(0, idx - value.length), ...newItem.slice(idx - value.length + 1)]);
    onReload?.();
  };

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tr}>
              <td className={styles.td}>{t('table.field')}</td>
              <td className={styles.td}>{t('table.value')}</td>
              <td className={styles.td}>{t('table.operation')}</td>
            </tr>
          </thead>
          <tbody>
            {[...value, ...newItem].map(([f, v], idx) => (
              <tr key={idx} className={styles.tr}>
                <td className={styles.td} style={{ width: '30%' }}>
                  <EditableText
                    readonly={mode === 'edit' && idx < value.length}
                    editMode={mode === 'add' || idx >= value.length ? 'fastify' : 'normal'}
                    value={f}
                    onChange={newField => handleChange(idx, newField, v)}
                    empty={t('redis.field')}
                  />
                </td>
                <td className={styles.td}>
                  <EditableText
                    value={v}
                    editMode={mode === 'add' || idx >= value.length ? 'fastify' : 'normal'}
                    onChange={newValue => handleChange(idx, f, newValue)}
                    empty={mode === 'add' ? t('redis.value') : t('redis.empty')}
                  />
                </td>
                <td className={classNames(styles.handler, styles.td)}>
                  <DeleteOutlined
                    className={styles.delIcon}
                    onClick={() => handleDeleteItem(idx, f)}
                  />
                  {idx >= value.length && (
                    <SaveOutlined
                      className={styles.icon}
                      onClick={() => handleSaveNewItem(idx, f, v)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.add}>
        <PlusCircleOutlined onClick={handleAddNewItem} />
      </div>
    </>
  );
};

export default HashEditor;
