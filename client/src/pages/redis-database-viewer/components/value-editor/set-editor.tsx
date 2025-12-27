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

interface SetEditorProps {
  mode: 'add' | 'edit';
  redisKey?: string;
  value?: TRedisValue;
  onChange?: (v: TRedisValue) => void;
  onReload?: () => void;
}

const defaultValue: TRedisValue = [['']];

const SetEditor: React.FC<SetEditorProps> = ({
  redisKey,
  value = defaultValue,
  mode = 'add',
  onChange,
  onReload,
}) => {
  const { t } = useTranslation();
  const [newItem, setNewItem] = useState<TRedisValue>([[]]);
  const { connectionId, dbName } = useDatabaseWindows();
  const updateSetValueMutation = useMutation(trpc.redis.updateSetValue.mutationOptions());

  const handleChange = async (index: number, member: string) => {
    if (mode === 'add') {
      onChange?.([[...value[0].slice(0, index), member, ...value[0].slice(index + 1)]]);
      return;
    }

    if (index < value[0].length) {
      return;
    }

    const idx = index - value[0].length;
    setNewItem([[...newItem[0].slice(0, idx), member, ...newItem[0].slice(idx + 1)]]);
  };

  const handleSaveNewItem = async (index: number) => {
    const idx = index - value[0].length;
    const member = newItem[0][idx];

    await updateSetValueMutation.mutateAsync({
      connectionId,
      dbName,
      key: redisKey!,
      member,
    });

    onReload?.();
    setNewItem([[...newItem[0].slice(0, idx), ...newItem[0].slice(idx + 1)]]);
  };

  const handleAdd = () => {
    if (mode === 'add') {
      onChange?.([[...value[0], '']]);
      return;
    }

    setNewItem([[...newItem[0], '']]);
  };

  const handleDelete = async (index: number) => {
    if (mode === 'add') {
      onChange?.([[...value[0].slice(0, index), ...value[0].slice(index + 1)]]);
      return;
    }

    if (index < value[0].length) {
      await updateSetValueMutation.mutateAsync({
        connectionId,
        dbName,
        key: redisKey!,
        isRemove: true,
        member: value[0][index],
      });
      onReload?.();
      return;
    }

    const idx = index - value[0].length;
    setNewItem([[...newItem[0].slice(0, idx), ...newItem[0].slice(idx + 1)]]);
  };

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tr}>
              <td className={styles.td}>{t('table.member')}</td>
              <td className={styles.td}>{t('table.operation')}</td>
            </tr>
          </thead>
          <tbody>
            {[...value[0], ...newItem[0]].map((member, index) => (
              <tr key={index} className={styles.tr}>
                <td className={styles.td}>
                  <EditableText
                    readonly={mode === 'edit' && index < value[0].length}
                    value={member}
                    editMode={mode === 'add' || index >= value[0].length ? 'fastify' : 'normal'}
                    onChange={v => handleChange(index, v)}
                    empty={
                      index >= value[0].length || mode === 'add'
                        ? t('redis.member')
                        : t('redis.empty')
                    }
                  />
                </td>
                <td className={classNames(styles.handler, styles.td)}>
                  <DeleteOutlined className={styles.delIcon} onClick={() => handleDelete(index)} />
                  {index >= value[0].length && (
                    <SaveOutlined
                      className={styles.icon}
                      onClick={() => handleSaveNewItem(index)}
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

export default SetEditor;
