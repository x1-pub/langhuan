import React, { useMemo } from "react";
import { CloseOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import { Divider, Popconfirm } from "antd";

import { useTranslation } from "react-i18next";
import { deleteRedisValue, RedisType, RedisValueRsp } from "@/api/redis";
import KeyTypeIcon from "../key-type-icon";
import ValueEditor from "../value-editor";
import sizeToText from "@/utils/size-to-text";
import formatSeconds from "@/utils/format-second";
import useMain from "@/utils/use-main";
import styles from './index.module.less'

interface EditKeyBoxProps {
  data: RedisValueRsp;
  onDelete: () => void;
  onCancel: () => void;
  onReload: () => void;
}

const EditKeyBox: React.FC<EditKeyBoxProps> = ({ data, onDelete, onCancel, onReload }) => {
  const { type, key, ttl, size, value } = data
  const { t } = useTranslation()
  const { connectionId, dbName } = useMain()

  const formatValue = useMemo(() => {
    if (type === RedisType.STRING) {
      return value
    }
    if (type === RedisType.LIST) {
      return { pushToHead: false, elements: value || [] }
    }
    if (type === RedisType.HASH) {
      return Object.keys(value || {}).map(key => ({ field: key, value: value[key] }))
    }
    if (type === RedisType.ZSET) {
      const zsetValue = []
      for (let i = 0; i < value?.length; i +=2) {
        zsetValue.push({
          member: value[i],
          score: value[i + 1]
        })
      }
      return zsetValue
    }
    if (type === RedisType.SET) {
      return value || []
    }

    return value
  }, [value, type])

  const handleDelete = async () => {
    await deleteRedisValue({ connectionId, dbName, key })
    onDelete()
  }

  return (
    <div className={styles.editBoxWrap}>
      <div className={styles.editBoxHeader}>
        <div className={styles.title}>
          <div className={styles.left}>
            <KeyTypeIcon type={type} />
            {/* <Input size="small" value={key} variant="borderless" /> */}
            <span className={styles.name}>{key}</span>
          </div>
          <CloseOutlined style={{ cursor: 'pointer' }} onClick={onCancel} />
        </div>

        <div className={styles.editBoxInfo}>
          <div className={styles.left}>
            <span>Key Size: {sizeToText(size)}</span>
            <span>Length: 111</span>
            <span>TTL: {formatSeconds(ttl)}</span>
          </div>
          <div className={styles.right}>
            <ReloadOutlined style={{ cursor: 'pointer' }} onClick={onReload} />
            <Popconfirm
              title={t('delete.title')}
              description={t('delete.desc')}
              placement="left"
              onConfirm={handleDelete}
            >
              <DeleteOutlined style={{ cursor: 'pointer' }} />
            </Popconfirm>
          </div>
        </div>
      </div>

      <Divider className={styles.divider} />

      <div className={styles.editBoxMain}>
        <ValueEditor type={type} value={formatValue} />
      </div>
    </div>
  )
}

export default EditKeyBox
