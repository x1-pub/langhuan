import React, { useEffect, useMemo, useState } from "react";
import { Tooltip, Button, Table, Popconfirm, type TablePaginationConfig, type TableProps } from "antd";
import { QuestionCircleOutlined, WarningOutlined } from "@ant-design/icons";
import * as uuid from 'uuid'

import useMain from "@/utils/use-main"
import { useTranslation } from "react-i18next";
import { getMysqlData, batchDelete, type Column } from "@/api/mysql";
import Editor from "./editor";
import BatchEditor from "./batch-editor";
import FieldEnter from "@/components/field-enter";
import getTextWidth from "@/utils/get-text-width";
import { getPureType, getConditionValue } from "@/utils/mysql-type";
import { showSuccess } from "@/utils/use-notifition.tsx";
import EllipsisText from "@/components/ellipsis-text";
import ExportDataModal from "./export";
import CodeEditor from "@/components/code-editor";
import styles from './index.module.less'

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_CONDITION = 'WHERE 1 = 1'
const MOCK_Table_ROW_KEY = '$langhuan.x1.pub-mock-mysql-uuid-key=string:bool_0G7uId4p_true'

const TableData: React.FC = () => {
  const { t } = useTranslation()
  const { connectionId, dbName, tableName } = useMain()
  const [loading, setLoading] = useState(false)
  const [condition, setCondition] = useState<string>(DEFAULT_CONDITION)
  const [pagination, setPagination] = useState<TablePaginationConfig>()
  const [total, setTotal] = useState<number>(0)
  const [list, setList] = useState<Record<string, any>[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editRow, setEditRow] = useState<Record<string, any>>()
  const [editorCondition, setEditorCondition] = useState<Record<string, any>[]>([])
  const [exportVisible, setExportVisible] = useState(false)
  const primaryColumns = columns.filter(col => col.Key === 'PRI')
  const tableColumns: TableProps<Record<string, any>>['columns'] = useMemo(() => {
    return columns.map(c => {
      const columnWidth = Math.max(getTextWidth(c.Field), getTextWidth(getPureType(c.Type))) + 32

      return {
        title: (
          <span className={styles.tableTitle}>
            <span>{c.Field}</span>
            <span className={styles.type}>{getPureType(c.Type)}</span>
          </span>
        ),
        dataIndex: c.Field,
        render: (value) => (
          <EllipsisText
            text={<FieldEnter type={c.Type} defaultValue={value} readonly={true} />}
            width={Math.max(250, columnWidth)}
          />
        ),
        width: columnWidth,
        ellipsis: true,
      }
    })
  }, [columns])

  const getData = async (current?: number, pageSize?: number, where?: string) => {
    setLoading(true)

    const { total, list, columns } = await getMysqlData({
      connectionId,
      dbName,
      tableName,
      current: current || pagination?.current || 1,
      pageSize: pageSize || pagination?.pageSize || DEFAULT_PAGE_SIZE,
      condition: where || condition
    }).finally(() => setLoading(false))

    const primaryKeys = columns.filter(col => col.Key === 'PRI').map(col => col.Field)
    const data = list.map(l => {
      const rowKey = primaryKeys.length ? primaryKeys.map(k => l[k]).join('-') : uuid.v4()
      return { ...l, [MOCK_Table_ROW_KEY]: rowKey }
    })

    setList(data)
    setTotal(total)
    setColumns(columns)
    setSelectedRowKeys([])
  }

  const handlePagination = (pagination: TablePaginationConfig) => {
    setPagination(pagination)
    getData(pagination.current, pagination.pageSize)
  }

  const handleConditionChange = (value?: string) => {
    setCondition(value || '')
  };

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    getData()
  }

  const handleReset = () => {
    setPagination({ ...pagination, current: 1 })
    setCondition(DEFAULT_CONDITION)
    getData(1, DEFAULT_PAGE_SIZE, DEFAULT_CONDITION)
  }

  const handleSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const handleEdit = (record: Record<string, any>) => {
    const editKeys = [record[MOCK_Table_ROW_KEY]]
    const condition = getRowsCondition(editKeys)
    setEditorCondition(condition)
    setEditRow([record])
  }

  const handleEditorSubmit = () => {
    setEditRow([])
    getData()
  }

  const handleCloseEditor = () => {
    setEditRow([])
  }

  const handleBatchEditorSubmit = () => {
    setEditRow([])
    getData()
  }

  const handleCloseBatchEditor = () => {
    setEditRow([])
  }

  const handleAdd = () => {
    setEditRow([{}])
  }

  const handleBatchEdit = () => {
    const row = list.filter(l => selectedRowKeys.includes(l[MOCK_Table_ROW_KEY]))
    if (!row.length) {
      return
    }
    const condition = getRowsCondition()
    setEditorCondition(condition)
    setEditRow(row)
  }

  const handleDelete = async () => {
    const condition = getRowsCondition()

    batchDelete({ connectionId, dbName, tableName, condition })
      .then(count => {
        showSuccess(t('mysql.affectedCount', { count }))
        getData()
      })
  }

  const handleExport = async () => {
    const condition = getRowsCondition()
    setEditorCondition(condition)
    setExportVisible(true)
  }

  const getRowsCondition = (keys = selectedRowKeys) => {
    const typeMap: Record<string, string> = {}
    columns.forEach(col => typeMap[col.Field] = getPureType(col.Type))

    const condition: Record<string, any>[] = []
    const conditionKeys = primaryColumns.length ? primaryColumns.map(col => col.Field) : Object.keys(typeMap)
    const rows = list.filter(l => keys.includes(l[MOCK_Table_ROW_KEY]))
    rows.forEach(row => {
      const rowCondition: Record<string, any> = {}
      conditionKeys.forEach(k => {
        rowCondition[k] = getConditionValue(row[k], typeMap[k])
      })
      condition.push(rowCondition)
    })

    return condition
  }

  useEffect(() => {
    getData()
  }, [])

  return (
    <div>
      <div className={styles.textBox}>
        <div className={styles.editor}>
          <CodeEditor
            language="sql"
            showLineNumbers={false}
            value={condition}
            onChange={handleConditionChange}
            fields={columns.map(col => col.Field)}
          />
        </div>
        <Tooltip
          placement='right'
          title={<>
            <div>{t('mysql.whereTip1')}</div>
            <div>(1) WHERE id = 10 AND name LIKE '%cat%'</div>
            <div>(2) WHERE age &gt;= 18 ORDER BY age DESC</div>
            <div>(3) WHERE year IN ('2024','2025')</div>
            <div>{t('mysql.whereTip2')}</div>
          </>}
          styles={{ body: { width: '300px' } }}
        >
          <QuestionCircleOutlined className={styles.help} />
        </Tooltip>
      </div>

      <div className={styles.buttonGroup}>
        {columns.length > 0 && !primaryColumns.length && <Tooltip title={t('mysql.noPriTips')} >
          <WarningOutlined className={styles.warn} />
        </Tooltip>}
        <Button onClick={handleAdd}>{t('button.add')}</Button>
        <Button disabled={!selectedRowKeys.length} onClick={handleBatchEdit}>{t('button.update')}</Button>
        <Popconfirm
          title={t('delete.title')}
          description={t('delete.desc')}
          onConfirm={handleDelete}
        >
          <Button disabled={!selectedRowKeys.length} danger>{t('button.delete')}</Button>
        </Popconfirm>
        <Button disabled={!selectedRowKeys.length} onClick={handleExport}>{t('button.export')}</Button>
        <Button onClick={handleReset}>{t('button.reset')}</Button>
        <Button type="primary" onClick={handleSearch}>{t('button.search')}</Button>
      </div>

      <Table
        className={styles.dataTable}
        rowKey={MOCK_Table_ROW_KEY}
        loading={loading}
        columns={tableColumns}
        dataSource={list}
        scroll={{ x: 'max-content', y: '200px' }}
        pagination={{
          showSizeChanger: true,
          pageSizeOptions: [DEFAULT_PAGE_SIZE, 50, 100, 500],
          total,
          current: pagination?.current,
          pageSize: pagination?.pageSize,
          defaultPageSize: DEFAULT_PAGE_SIZE,
          showTotal: (total) => t('mysql.total', { total })
        }}
        onChange={handlePagination}
        rowSelection={{
          columnWidth: '24px',
          fixed: true,
          selectedRowKeys,
          onChange: handleSelectChange
        }}
        onRow={(record) => {
          return {
            onDoubleClick: () => handleEdit(record),
          };
        }}
      />

      <Editor
        data={editRow?.[0]}
        onOk={handleEditorSubmit}
        onCancel={handleCloseEditor}
        show={editRow?.length === 1}
        columns={columns}
        condition={editorCondition}
      />

      <BatchEditor
        onOk={handleBatchEditorSubmit}
        onCancel={handleCloseBatchEditor}
        show={editRow?.length > 1}
        columns={columns}
        condition={editorCondition}
      />

      <ExportDataModal
        visible={exportVisible}
        condition={editorCondition}
        onOk={() => setExportVisible(false)}
        onCancel={() => setExportVisible(false)}
        fields={columns.map(c => c.Field)}
      />
    </div>
  )
}

export default TableData
