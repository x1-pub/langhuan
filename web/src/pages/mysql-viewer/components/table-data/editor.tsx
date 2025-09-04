import React, { useState } from 'react'
import { Button, Modal, Tooltip, Table, type TableProps } from 'antd';
import { KeyOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { update, insertOne, type Column } from "@/api/mysql";
import FieldEnter from '@/components/field-enter';
import useMain from '@/utils/use-main';
import { showSuccess } from '@/utils/use-notifition.tsx';
import EllipsisText from "@/components/ellipsis-text";
import styles from './editor.module.less'

interface EditorProps {
  data?: Record<string, any>;
  columns: Column[];
  condition: Record<string, any>[];
  onOk: () => void;
  onCancel: () => void;
  show?: boolean;
}

const Editor: React.FC<EditorProps> = ({ data = {}, columns, onOk, onCancel, show, condition }) => {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({});
  const { t } = useTranslation()
  const { connectionId, dbName, tableName } = useMain()
  const type = data && Object.keys(data).length ? 'update' : 'add'

  const tableColumns: TableProps<Record<string, any>>['columns'] = [
    {
      title: t('table.key'),
      dataIndex: 'key',
      key: 'key',
      width: 200,
      render: (value, record) => {
        const pri = record.pri ? <KeyOutlined style={{ color: '#EBAD32' }} /> : null
        const mark = record.required ? <span  className={styles.mark}>*</span> : null
        const text = <EllipsisText text={value} width={150} />
        const comment = record.desc ? <Tooltip placement="right" title={record.desc}>
          <QuestionCircleOutlined />
        </Tooltip> : null
        
        return <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>{pri}{mark}{text}{comment}</span>
      }
    },
    {
      title: t('table.value'),
      dataIndex: 'value',
      key: 'value',
      render: (value, record) => {
        return <FieldEnter onChange={handleChange} type={record.type} name={record.key} defaultValue={value}  />
      }
    },
    {
      title: t('table.type'),
      dataIndex: 'type',
      key: 'type',
      width: 135,
      ellipsis: true
    },
    {
      title: t('table.default'),
      dataIndex: 'default',
      key: 'default',
      width: 130,
      ellipsis: true
    },
  ]

  const dataSource = columns.map(col => ({
    key: col.Field,
    value: data[col.Field],
    type: col.Type,
    default: col.Default,
    desc: col.Comment,
    required: col.Null === 'NO' && col.Extra !== 'auto_increment' && !col.Default,
    pri: col.Key === 'PRI',
    autoIncrement: col.Extra === 'auto_increment',
  }))

  const handleChange = (name: string, value: any) => {
    setForm({ ...form, [name]: value })
  }

  const handleOk = async () => {
    setLoading(true)
    let result: number | string

    try {
      if (type === 'update') {
        result = await update({ connectionId, dbName, tableName, data: form, condition })
      } else {
        result = await insertOne({ connectionId, dbName, tableName, data: form })
      }
      showSuccess(t('mysql.affectedCount', { count: result }))
      onOk()
    } finally {
      setLoading(false)
    }
  }

  const clearForm = () => {
    setLoading(false)
    setForm({})
  }

  return (
    <>
      <Modal
        wrapClassName={styles.modalWrap}
        destroyOnClose={true}
        title={t(`button.${type}`)}
        open={show}
        onCancel={onCancel}
        maskClosable={false}
        footer={[
          <Button key="cancel" onClick={onCancel}>{t('button.cancel')}</Button>,
          <Button key="ok" type="primary" loading={loading} onClick={handleOk}>{t('button.submit')}</Button>
        ]}
        afterClose={clearForm}
      >
        <Table
          rowKey="key"
          className={styles.tableWrap}
          columns={tableColumns}
          dataSource={dataSource}
          pagination={false}
        />
      </Modal>
    </>
  )
}

export default Editor