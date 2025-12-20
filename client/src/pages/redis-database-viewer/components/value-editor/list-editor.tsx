import React, { useState } from 'react';
import { Dropdown } from 'antd';
import { DeleteOutlined, PlusCircleOutlined, SaveOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import styles from './index.module.less';
import EditableText from '@/components/editable-text';
import { TRedisValue } from '@packages/types/redis';
import { trpc } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';
import useDatabaseWindows from '@/hooks/use-database-windows';

interface ListEditorProps {
  mode: 'add' | 'edit';
  redisKey?: string;
  value?: TRedisValue;
  onChange?: (v: TRedisValue) => void;
  onReload?: () => void;
}

const defaultValue: TRedisValue = [['']];

const ListEditor: React.FC<ListEditorProps> = ({
  redisKey,
  value = defaultValue,
  mode,
  onChange,
  onReload,
}) => {
  const { t } = useTranslation();
  const [newItem, setNewItem] = useState<TRedisValue>([[]]);
  const { connectionId, dbName } = useDatabaseWindows();
  const updateListValueMutation = useMutation(trpc.redis.updateListValue.mutationOptions());

  const handleChange = async (index: number, element: string) => {
    if (mode === 'add') {
      onChange?.([[...value[0].slice(0, index), element, ...value[0].slice(index + 1)]]);
      return;
    }

    if (index < value[0].length) {
      await updateListValueMutation.mutateAsync({
        connectionId,
        dbName,
        key: redisKey!,
        isModify: true,
        element,
        index,
      });
      onReload?.();
      return;
    }

    const idx = index - value[0].length;
    setNewItem([[...newItem[0].slice(0, idx), element, ...newItem[0].slice(idx + 1)]]);
  };

  const handleSaveNewItem = async (index: number, isPushToHead: boolean) => {
    const idx = index - value[0].length;
    const element = newItem[0][idx];

    await updateListValueMutation.mutateAsync({
      connectionId,
      dbName,
      key: redisKey!,
      isPushToHead,
      element,
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
      await updateListValueMutation.mutateAsync({
        connectionId,
        dbName,
        key: redisKey!,
        isRemove: true,
        index,
        element: value[0][index],
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
              <td className={styles.td}>{t('table.element')}</td>
              <td className={styles.td}>{t('table.operation')}</td>
            </tr>
          </thead>
          <tbody>
            {[...value[0], ...newItem[0]].map((element, index) => (
              <tr key={index} className={styles.tr}>
                <td className={styles.td}>
                  <EditableText
                    value={element}
                    onChange={newElement => handleChange(index, newElement)}
                    editMode={mode === 'add' || index >= value[0].length ? 'fastify' : 'normal'}
                    empty={
                      index >= value[0].length || mode === 'add'
                        ? t('redis.element')
                        : t('redis.empty')
                    }
                  />
                </td>
                <td className={classNames(styles.handler, styles.td)}>
                  <DeleteOutlined className={styles.delIcon} onClick={() => handleDelete(index)} />
                  {index >= value[0].length && (
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: '1',
                            label: t('redis.pushToTail'),
                            onClick: () => handleSaveNewItem(index, false),
                          },
                          {
                            key: '2',
                            label: t('redis.pushToHead'),
                            onClick: () => handleSaveNewItem(index, true),
                          },
                        ],
                      }}
                    >
                      <SaveOutlined className={styles.icon} />
                    </Dropdown>
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

export default ListEditor;
