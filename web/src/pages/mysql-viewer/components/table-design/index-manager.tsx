import React, { useEffect, useState } from "react";
import { Button, Table, TableProps, Card, Modal, Popconfirm, Form, Input, Select, Row, Col, InputNumber } from "antd";
import { useTranslation } from "react-i18next";
import useNotification from "@/utils/use-notifition.tsx";

import { type Column, type TableIndex, IndexType, addTableIndex, deleteTableIndex, updateTableIndex } from "@/api/mysql";
import styles from './index.module.less'
import useMain from "@/utils/use-main";
import EllipsisText from "@/components/ellipsis-text";
import { dealIndexData, getTypeFromIndexData } from "./utils";

interface IndexManagerProps {
  data: TableIndex[];
  columns: Column[];
  onOk?: () => void;
}

interface FieldExtraType {
  [key: string]: {
    len?: number | null;
    order?: 'ASC' | 'DESC'
  };
}

interface FormType {
  type: IndexType;
  field: string[];
  name?: string;
  comment?: string;
}

const indexTypeOptions = [
  {
    label: IndexType.PRIMARY,
    value: IndexType.PRIMARY,
  },
  {
    label: IndexType.UNIQUE,
    value: IndexType.UNIQUE,
  },
  {
    label: IndexType.FULLTEXT,
    value: IndexType.FULLTEXT,
  },
  {
    label: IndexType.INDEX,
    value: IndexType.INDEX,
  },
  {
    label: IndexType.SPATIAL,
    value: IndexType.SPATIAL,
  },
]

const IndexManager: React.FC<IndexManagerProps> = (props) => {
  const { data, columns, onOk } = props
  const { t } = useTranslation()
  const notify = useNotification()
  const { connectionId, dbName, tableName } = useMain()
  const [open, setOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [editIndex, setEditIndex] = useState<TableIndex>()
  const [fieldExtra, setFieldExtra] = useState<FieldExtraType>({})
  const [form] = Form.useForm<FormType>();
  const formFieldValue = Form.useWatch('field', form)
  const dataAfter = dealIndexData(data)
  const tableColumns: TableProps<TableIndex>['columns'] = [
    {
      title: '名称',
      dataIndex: 'Key_name',
    },
    {
      title: '字段',
      dataIndex: 'Column_name',
    },
    {
      title: '索引类型',
      dataIndex: 'Index_type',
      render: (_value, record) => getTypeFromIndexData(record),
    },
    {
      title: '注释',
      dataIndex: 'Index_comment',
    },
    {
      title: '操作',
      dataIndex: '',
      render: (_, record) => (
        <>
          <Button className={styles.columnActionBtn} onClick={() => handleEdit(record)} color="cyan" variant="link">{t('button.edit')}</Button>
          <Popconfirm
            title={t('delete.title')}
            description={t('delete.desc')}
            onConfirm={() => handleDelete(record)}
          >
            <Button className={styles.columnActionBtn} color="danger" variant="link">{t('button.delete')}</Button>
          </Popconfirm>
        </>
      ),
      width: 140,
    },
  ]

  const handleEdit = (record: TableIndex) => {
    setEditIndex(record)
    setOpen(true)
  }

  const handleDelete = async (record: TableIndex) => {
    await deleteTableIndex({ name: record.Key_name, connectionId, dbName, tableName }).catch(err => {
      notify.error({
        message: t('execution.failed'),
        description: <span style={{ whiteSpace: 'pre-wrap' }}>{String(err)}</span>,
        duration: null,
      })
      return Promise.reject()
    })
    onOk?.()
  }

  const handleSubmit = async () => {
    const { field: formField, name, type, comment } = await form.validateFields()
    const field = (formField || []).map((k: string) => ({
      name: k,
      len: fieldExtra[k]?.len,
      order: fieldExtra[k]?.order,
    }))
    const payload = {
      connectionId,
      dbName,
      tableName,
      data: {
        field,
        type,
        name,
        comment,
      }
    }
    setLoading(true)
    try {
      if (editIndex) {
        await updateTableIndex({ ...payload, name: editIndex.Key_name })
      } else {
        await addTableIndex(payload)
      }
      onOk?.()
      setOpen(false)
    } catch(err) {
      notify.error({
        message: t('execution.failed'),
        description: <span style={{ whiteSpace: 'pre-wrap' }}>{String(err)}</span>,
        duration: null,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEditIndex(undefined)
    setOpen(false)
  }

  const handleFieldExtraChange = (field: string, type: 'len' | 'order', value?: number | string | null) => {
    const old = fieldExtra[field] || {}
    setFieldExtra({ ...fieldExtra, [field]: { ...old, [type]: value } })
  }

  useEffect(() => {
    if (open && editIndex) {
      const type = getTypeFromIndexData(editIndex)
      const field = editIndex.Column_name.split(',')
      const extra: FieldExtraType = {}
      field.forEach(f => {
        const idxData = data.find(d => d.Column_name === f)
        extra[f] = {
          order: idxData?.Collation === 'D' ? 'DESC' : 'ASC',
          len: idxData?.Sub_part
        }
      })
      setFieldExtra(extra)
      form.setFieldsValue({ type, field, name: editIndex.Key_name, comment: editIndex.Index_comment })
    }

    if (!open) {
      setFieldExtra({})
      form?.resetFields()
      setEditIndex(undefined)
    }
  }, [editIndex, open])

  return (
    <div>
      <Card className={styles.card} title="索引" extra={<Button color="cyan" variant="link" onClick={() => setOpen(true)}>新建</Button>}>
        <Table
          rowKey={(record) => record.Key_name + record.Column_name + record.Index_type + record.Seq_in_index}
          dataSource={dataAfter}
          columns={tableColumns}
          pagination={false}
          onRow={(record) => {
            return {
              onDoubleClick: () => handleEdit(record),
            };
          }}
        />
      </Card>
      <Modal
        width={600}
        destroyOnClose={true}
        title={t(`button.${editIndex ? 'update' : 'add'}`)}
        open={open}
        onCancel={handleClose}
        maskClosable={false}
        footer={[
          <Button key="cancel" onClick={handleClose}>{t('button.cancel')}</Button>,
          <Button key="ok" type="primary" loading={loading} onClick={handleSubmit}>{t('button.submit')}</Button>
        ]}
      >
        <Form
          style={{ paddingTop: '10px' }}
          form={form}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 20 }}
          labelAlign="left"
        >
          <Form.Item
            label={'索引类型'}
            name="type"
            rules={[{ required: true, message: t('connectionTypeError') }]}
            
          >
            <Select options={indexTypeOptions} />
          </Form.Item>
          <Form.Item
            label={'字段'}
            name="field"
            rules={[{ required: true, message: t('connectionNameError') }]}
          >
            <Select mode="multiple" options={columns} fieldNames={{ label: 'Field', value: 'Field'}} />
          </Form.Item>

          {/* 扩展 */}
          {formFieldValue?.map(field => {
            return (
              <Row key={field} gutter={5} style={{ marginBottom: '25px' }}>
                <Col span={4}></Col>
                <Col span={8}>
                  <EllipsisText text={field} />
                </Col>
                <Col span={6}>
                  <InputNumber
                    defaultValue={fieldExtra[field]?.len ?? undefined}
                    style={{ width: '100%' }}
                    placeholder="键长度"
                    onChange={(v) => handleFieldExtraChange(field, 'len', v)}
                  />
                </Col>
                <Col span={6}>
                  <Select
                    defaultValue={fieldExtra[field]?.order}
                    placeholder="排序规则"
                    style={{ width: '100%' }}
                    options={[{ label: 'ASC', value: 'ASC' }, { label: 'DESC', value: 'DESC' }]}
                    onChange={(v) => handleFieldExtraChange(field, 'order', v)}
                  />
                </Col>
              </Row>
            )
          })}

          <Form.Item
            label={'名称'}
            name="name"
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            label={'注释'}
            name="comment"
          >
            <Input autoComplete="off" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default IndexManager
