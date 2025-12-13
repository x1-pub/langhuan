import React, { useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, PlusCircleOutlined, SaveOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Input } from 'antd';
import { clone, flatten } from 'lodash';
import { useMutation } from '@tanstack/react-query';

import EditableText from '@/components/editable-text';
import styles from './index.module.less';
import { TRedisValue } from '@packages/types/redis';
import useMain from '@/utils/use-main';
import { trpc } from '@/utils/trpc';

interface StreamEditorProps {
  mode: 'add' | 'edit';
  redisKey?: string;
  value?: TRedisValue;
  onChange?: (v: TRedisValue) => void;
  onReload?: () => void;
}

const ENTRY_ID_KEY = 'langhuan_redis_stream_entry_id_key_9g8nxoa04lac724nsdfg-0';

const StreamEditor: React.FC<StreamEditorProps> = ({
  redisKey,
  value = [],
  mode = 'add',
  onChange,
  onReload,
}) => {
  const { t } = useTranslation();
  const [newEntryId, setNewEntryId] = useState<string>('*');
  const [newItem, setNewItem] = useState<[string, string][]>(mode === 'add' ? [['', '']] : []);
  const { connectionId, dbName } = useMain();
  const updateStreamValueMutation = useMutation(trpc.redis.updateStreamValue.mutationOptions());

  const [columns, data] = useMemo(() => {
    const columnsSet = new Set();
    const datas: Record<string, string>[] = [];

    value.forEach(entry => {
      const data: Record<string, string> = {};
      entry.forEach((key, index) => {
        if (index === 0) {
          data[ENTRY_ID_KEY] = key;
        } else if (index % 2 === 1) {
          columnsSet.add(key);
          data[key] = entry[index + 1];
        }
      });
      datas.push(data);
    });

    const columnsArr = [...columnsSet] as string[];
    return [columnsArr, datas];
  }, [value]);

  const handleAddNewEntry = () => {
    setNewEntryId('*');
    setNewItem([...newItem, ['', '']]);
  };

  const handleFieldChange = (index: number, v: string) => {
    const newArr = clone(newItem);
    newArr[index] = [v, newArr[index][1]];
    setNewItem(newArr);
  };

  const handleValueChange = (index: number, v: string) => {
    const newArr = clone(newItem);
    newArr[index] = [newArr[index][0], v];
    setNewItem(newArr);
  };

  const handleDeleteEntry = async (id: string) => {
    await updateStreamValueMutation.mutateAsync({
      connectionId,
      dbName,
      key: redisKey!,
      entry: [[id]],
      isRemove: true,
    });
    onReload?.();
  };

  const handleSaveNewItem = async () => {
    await updateStreamValueMutation.mutateAsync({
      connectionId,
      dbName,
      key: redisKey!,
      entry: [[newEntryId, ...flatten(newItem)]],
    });
    onReload?.();
    setNewItem([]);
  };

  const handleDeleteNewItem = (index: number) => {
    setNewItem([...newItem.slice(0, index), ...newItem.slice(index + 1)]);
  };

  useEffect(() => {
    if (mode === 'add') {
      onChange?.([[newEntryId, ...flatten(newItem)]]);
    }
  }, [newItem, mode]);

  return (
    <>
      {mode === 'edit' && data.length > 0 && (
        <div className={styles.tableWrap} style={{ marginBottom: '10px' }}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tr}>
                <td className={styles.td}>{t('redis.entryId')}</td>
                {columns.map((column, cid) => (
                  <td key={cid} className={styles.td}>
                    {column}
                  </td>
                ))}
                <td className={styles.td}>{t('table.operation')}</td>
              </tr>
            </thead>
            <tbody>
              {data.map((item, did) => (
                <tr key={did} className={styles.tr}>
                  <td className={styles.td}>
                    <EditableText readonly value={item[ENTRY_ID_KEY]} empty={t('redis.value')} />
                  </td>
                  {columns.map((column, cid) => (
                    <td key={cid} className={styles.td}>
                      <EditableText readonly value={item[column]} empty={t('redis.empty')} />
                    </td>
                  ))}
                  <td className={classNames(styles.handler, styles.td)}>
                    <DeleteOutlined
                      className={styles.delIcon}
                      onClick={() => handleDeleteEntry(item[ENTRY_ID_KEY])}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(mode === 'add' || newItem.length > 0) && (
        <>
          <div style={{ marginBottom: '10px' }}>
            {t('redis.entryId')}*
            <Input value={newEntryId} onChange={e => setNewEntryId(e.target.value)} />
            <span
              style={{
                fontSize: '12px',
                // color: idStatus === 'error' ? '#F0685F' : undefined,
              }}
            >
              {t('redis.entryIdTips')}
            </span>
          </div>
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
                {newItem.map(([f, v], idx) => (
                  <tr key={idx} className={styles.tr}>
                    <td className={styles.td}>
                      <EditableText
                        value={f}
                        empty={t('redis.field')}
                        editMode="fastify"
                        onChange={v => handleFieldChange(idx, v)}
                      />
                    </td>
                    <td className={styles.td} style={{ width: '50%' }}>
                      <EditableText
                        value={v}
                        empty={t('redis.value')}
                        editMode="fastify"
                        onChange={v => handleValueChange(idx, v)}
                      />
                    </td>
                    <td className={classNames(styles.handler, styles.td)}>
                      <DeleteOutlined
                        className={styles.delIcon}
                        onClick={() => handleDeleteNewItem(idx)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className={styles.add}>
        {mode === 'edit' && newItem.length > 0 && (
          <SaveOutlined className={styles.icon} onClick={handleSaveNewItem} />
        )}
        <PlusCircleOutlined onClick={handleAddNewEntry} />
      </div>
    </>
  );
};

export default StreamEditor;
