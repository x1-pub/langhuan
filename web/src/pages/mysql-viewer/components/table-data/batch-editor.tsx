import React, { useState, useEffect } from 'react'
import { Button, Select, Modal } from 'antd';
import { PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { update, type Column } from "@/api/mysql";
import FieldEnter from '@/components/field-enter';
import useMain from '@/utils/use-main';
import useNotification from '@/utils/use-notifition.tsx';
import EllipsisText from '@/components/ellipsis-text';
import styles from './batch-editor.module.less'

interface BatchEditorProps {
  columns: Column[];
  condition: Record<string, any>[];
  onOk: () => void;
  onCancel: () => void;
  show: boolean;
}

const BatchEditor: React.FC<BatchEditorProps> = ({ columns, condition, onOk, onCancel, show }) => {
  const notify = useNotification()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({});
  const [fieldList, setFieldList] = useState<{ name: string, type: string }[]>([])
  const { t } = useTranslation()
  const { connectionId, dbName, tableName } = useMain()
  const fieldOptions = columns.map(col => ({ label: col.Field, value: col.Field, disabled: Object.keys(form).includes(col.Field) }))

  const handleOk = async () => {
    setLoading(true)
    await update({ connectionId, dbName, tableName, data: form, condition })
      .then(count => {
        notify.success({
          message: t('execution.success'),
          description: t('execution.affectedCount', { count }),
          duration: 3,
        })
        onOk()
      }).catch(err => {
        notify.error({
          message: t('execution.failed'),
          description: <span style={{ whiteSpace: 'pre-wrap' }}>{String(err)}</span>,
          duration: null,
        })
      })
    
    setLoading(false)
  }

  const handleAddField = () => {
    const keys = Object.keys(form)
    const column = columns.find(col => !keys.includes(col.Field))
    if (!column) {
      return
    }
    setFieldList([...fieldList, { name: column.Field, type: column.Type }])
    setForm({ ...form, [column.Field]: null })
  }

  const handleSelectChange = (name: string, index: number) => {
    const front = fieldList.slice(0, index)
    const behind = fieldList.slice(index + 1)
    const column = columns.find(col => col.Field === name)!
    setFieldList([...front, { name: column.Field, type: column.Type },  ...behind])
    const delField = fieldList[index].name
    const copyForm = { ...form }
    delete copyForm[delField]
    setForm({ ...copyForm, [name]: null })
  }

  const handleFieldChange = (name: string, value: any) => {
    setForm({ ...form, [name]: value })
  }

  useEffect(() => {
    if (columns.length > 0 && show) {
      setFieldList([{ name: columns[0].Field, type: columns[0].Type }])
      setForm({ [columns[0].Field]: null })
    }
  }, [show])

  return (
    <>
      <Modal
        wrapClassName={styles.batchModalWrap}
        destroyOnClose={true}
        title={t(`button.batchUpdate`)}
        open={show}
        onCancel={onCancel}
        maskClosable={false}
        footer={[
          <Button key="cancel" onClick={onCancel}>{t('button.cancel')}</Button>,
          <Button key="ok" type="primary" loading={loading} onClick={handleOk}>{t('button.submit')}</Button>
        ]}
      >
        {fieldList.map((field, index) => (
          <div className={styles.row} key={field.name}>
            <EllipsisText text={field.type} width={120} />
            <Select className={styles.selecter} options={fieldOptions} onChange={(name) => handleSelectChange(name, index)} defaultValue={field.name} />
            <span className={styles.update}>=</span>
            <FieldEnter style={{ width: '400px' }} type={field.type} name={field.name} onChange={handleFieldChange} />
            {fieldList.length > 1 && <MinusCircleOutlined />}
            {fieldList.length === index + 1 && fieldList.length < columns.length && <PlusCircleOutlined onClick={handleAddField} />}
          </div>
        ))}
      </Modal>
    </>
  )
}

export default BatchEditor