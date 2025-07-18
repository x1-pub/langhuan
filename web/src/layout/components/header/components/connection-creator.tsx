import React, { useState } from "react";
import { Tooltip } from 'antd'
import { AppstoreAddOutlined } from '@ant-design/icons'
import { useTranslation } from "react-i18next";

import { createConnection, type CreateConnectionParams } from '@/api/connection'
import ConnectionModal from '@/components/connection-modal'
import styles from './index.module.less'
import useNotification from "@/utils/use-notifition.tsx";

interface DBCreatorProps {
  onOk?: () => void
}
const DBCreator: React.FC<DBCreatorProps> = ({ onOk }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const notify = useNotification()

  const handleSubmit = async (vals: CreateConnectionParams) => {
    setLoading(true)
    await createConnection(vals)
      .then(() => {
        setOpen(false)
        onOk?.()
      })
      .catch(err => {
        notify.error({
          message: t('创建失败'),
          description: <span style={{ whiteSpace: 'pre-wrap' }}>{String(err)}</span>,
          duration: null,
        })
      })
    setLoading(false)
  }

  return (
    <>
      <Tooltip placement="bottom" title={t('connection.create')}>
        <AppstoreAddOutlined className={styles.iconColor} onClick={() => setOpen(true)} />
      </Tooltip>
      <ConnectionModal loading={loading} open={open} onOk={handleSubmit} onCancel={() => setOpen(false)} />
    </>
  )
}

export default DBCreator