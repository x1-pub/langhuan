import React from 'react';
import { CloseOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { Divider, Popconfirm, Tooltip } from 'antd';

import { useTranslation } from 'react-i18next';
import KeyTypeIcon from '../key-type-icon';
import ValueEditor from '../value-editor';
import { formatByteSize } from '@/utils/format-byte-size';
import useMain from '@/utils/use-main';
import EditableText from '@/components/editable-text';
import styles from './index.module.less';

import { RouterOutput, trpc } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';

type TRedisValue = RouterOutput['redis']['getValue'];

interface EditKeyBoxProps {
  data: TRedisValue;
  onDelete: () => void;
  onModifyKey: (key: string) => void;
  onCancel: () => void;
  onReload: () => void;
}

const EditKeyBox: React.FC<EditKeyBoxProps> = ({
  data,
  onDelete,
  onModifyKey,
  onCancel,
  onReload,
}) => {
  const { type, key, ttl, size, value } = data;
  const { t } = useTranslation();
  const { connectionId, dbName } = useMain();
  const deleteKeyMutation = useMutation(trpc.redis.deleteKey.mutationOptions());
  const modifyTTLMutation = useMutation(trpc.redis.modifyTTL.mutationOptions());
  const modifyKeyMutation = useMutation(trpc.redis.modifyKey.mutationOptions());

  const handleDelete = async () => {
    await deleteKeyMutation.mutateAsync({ connectionId, dbName, key });
    onDelete();
  };

  const handleModifyTTL = async (ttl: string) => {
    await modifyTTLMutation.mutateAsync({
      connectionId,
      dbName,
      key,
      ttl: Math.max(-1, Number(ttl) || -1),
    });
    onReload();
  };

  const handleModifyKey = async (newKey: string) => {
    await modifyKeyMutation.mutateAsync({ connectionId, dbName, key, newKey });
    onModifyKey(newKey);
  };

  return (
    <div className={styles.editBoxWrap}>
      <div className={styles.editBoxHeader}>
        <div className={styles.title}>
          <div className={styles.left}>
            <KeyTypeIcon type={type} />
            <EditableText tooltip={key} value={key} onChange={handleModifyKey} />
          </div>
          <Tooltip placement="left" title={t('button.close')}>
            <CloseOutlined style={{ cursor: 'pointer' }} onClick={onCancel} />
          </Tooltip>
        </div>

        <div className={styles.editBoxInfo}>
          <div className={styles.left}>
            <span>
              {t('redis.keySize')}: {formatByteSize(size)}
            </span>
            <span>{t('redis.length')}: 111</span>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <span>TTL:</span>
              <EditableText value={String(ttl)} onChange={handleModifyTTL} />
            </span>
          </div>
          <div className={styles.right}>
            <Tooltip placement="left" title={t('button.refresh')}>
              <ReloadOutlined style={{ cursor: 'pointer' }} onClick={onReload} />
            </Tooltip>
            <Popconfirm
              title={t('delete.title')}
              description={t('delete.desc')}
              placement="left"
              onConfirm={handleDelete}
            >
              <Tooltip placement="left" title={t('button.delete')}>
                <DeleteOutlined style={{ cursor: 'pointer' }} />
              </Tooltip>
            </Popconfirm>
          </div>
        </div>
      </div>

      <Divider className={styles.divider} />

      <ValueEditor mode="edit" redisKey={key} type={type} value={value} onReload={onReload} />
    </div>
  );
};

export default EditKeyBox;
