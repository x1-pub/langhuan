import React, { useState } from "react";
import { Button, Card, Popconfirm, Table, TableProps, Tooltip } from "antd";
import { getPureType } from "@/utils/mysql-type";
import { useTranslation } from "react-i18next";

import { type Column, deleteColumn } from "@/api/mysql";
import FieldEditor from "./field-editor";
import styles from './index.module.less'
import useMain from "@/utils/use-main";
import useNotification from "@/utils/use-notifition.tsx";

interface ColumnsManagerProps {
  data: Column[];
  onOk?: () => void;
}
const ColumnsManager: React.FC<ColumnsManagerProps> = (props) => {
  const { t } = useTranslation()
  const notify = useNotification()
  const { connectionId, dbName, tableName } = useMain()
  const { data, onOk } = props
  const [visible, setVisible] = useState(false)
  const [editRow, setEditRow] = useState<Column>()
  const tableColumns: TableProps<Column>['columns'] = [
    {
      title: '名称',
      dataIndex: 'Field',
    },
    {
      title: '类型',
      dataIndex: 'Type',
      render: (value) => getPureType(value),
    },
    {
      title: 'Null',
      dataIndex: 'Null',
    },
    {
      title: '注释',
      dataIndex: 'Comment',
    },
    {
      title: '操作',
      dataIndex: '',
      render: (_, record) => (
        <>
          <Button
            className={styles.columnActionBtn}
            color="cyan"
            variant="link"
            onClick={() => handleEdit(record)}
          >
            {t('button.edit')}
          </Button>
          <Popconfirm
            title={t('delete.title')}
            description={t('delete.desc')}
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip placement="top" title={data.length === 1 ? 'xxxx' : ''}>         
              <Button
                className={styles.columnActionBtn}
                color="danger"
                variant="link"
                disabled={data.length === 1}
              >
                {t('button.delete')}
              </Button>
            </Tooltip>
          </Popconfirm>
        </>
      ),
      width: 140,
    },
  ]

  const handleSubmit = () => {
    setEditRow(undefined)
    setVisible(false)
    onOk?.()
  }

  const handleCancel = () => {
    setEditRow(undefined)
    setVisible(false)
  }

  const handleEdit = (record: Column) => {
    setEditRow(record)
    setVisible(true)
  }

  const handleDelete = async (record: Column) => {
    await deleteColumn({ connectionId, dbName, tableName, name: record.Field }).catch(err => {
      notify.error({
        message: t('execution.failed'),
        description: <span style={{ whiteSpace: 'pre-wrap' }}>{String(err)}</span>,
        duration: null,
      })
      return Promise.reject()
    })
    onOk?.()
  }

  return (
    <div>
      <Card className={styles.card} title="字段" extra={<Button color="cyan" variant="link" onClick={() => setVisible(true)}>新建</Button>}>
        <Table
          rowKey="Field"
          dataSource={data}
          columns={tableColumns}
          pagination={false}
          onRow={(record) => {
            return {
              onDoubleClick: () => handleEdit(record),
            };
          }}
        />
      </Card>
      <FieldEditor visible={visible} onSubmit={handleSubmit} onCancel={handleCancel} editRow={editRow} />
    </div>
  )
}

export default ColumnsManager
