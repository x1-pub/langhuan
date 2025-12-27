import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Tooltip,
  Button,
  Table,
  Popconfirm,
  type TablePaginationConfig,
  type TableProps,
} from 'antd';
import { QuestionCircleOutlined, WarningOutlined } from '@ant-design/icons';
import * as uuid from 'uuid';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import useDatabaseWindows from '@/hooks/use-database-windows';
import Editor from './editor';
import BatchEditor from './batch-editor';
import { measureTextWidth } from '@/utils/measure-text-width';
import { showSuccess } from '@/utils/global-notification';
import EllipsisText from '@/components/ellipsis-text';
import ExportDataModal from './export';
import CodeEditor from '@/components/code-editor';
import styles from './index.module.less';
import { trpc, trpcClient } from '@/utils/trpc';
import type { TMySQLRawData, TMySQLCondition } from '@packages/types/mysql';
import MySQLRawDataDisplay from '@/components/mysql-raw-data-display';
import { getConditionValue, getMySQLPureType } from '@/utils/mysql-generator';

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_WHERE_CLAUSE = 'WHERE 1 = 1';
const MOCK_Table_ROW_KEY = '$langhuan.x1.pub-mock-mysql-uuid-key=string:bool_0G7uId4p_true';

const TableData: React.FC = () => {
  const { t } = useTranslation();
  const { connectionId, dbName, tableName } = useDatabaseWindows();
  const [pagination, setPagination] = useState<TablePaginationConfig>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [editRow, setEditRow] = useState<Record<string, TMySQLRawData>[]>();
  const [editorCondition, setEditorCondition] = useState<TMySQLCondition>([]);
  const [exportVisible, setExportVisible] = useState(false);
  const [whereClause, setWhereClause] = useState<string | undefined>(DEFAULT_WHERE_CLAUSE);
  const whereClauseRef = useRef<string | undefined>(DEFAULT_WHERE_CLAUSE);

  const batchDeleteDataMutation = useMutation(trpc.mysql.batchDeleteData.mutationOptions());

  const stableInput = {
    connectionId,
    dbName,
    tableName,
    current: pagination?.current || 1,
    pageSize: pagination?.pageSize || DEFAULT_PAGE_SIZE,
  };

  const getTableDataQuery = useQuery({
    queryFn: () =>
      trpcClient.mysql.getTableData.query({ ...stableInput, whereClause: whereClauseRef.current! }),
    queryKey: ['mysql.getTableData', stableInput],
    staleTime: 5 * 60 * 1000,
    enabled: !!whereClauseRef.current,
  });

  const primaryColumns = getTableDataQuery.data?.columns.filter(col => col.Key === 'PRI') || [];

  const [tableColumns, tableData] = useMemo(() => {
    const columns: TableProps<Record<string, TMySQLRawData>>['columns'] =
      getTableDataQuery.data?.columns.map(c => {
        const columnWidth =
          Math.max(measureTextWidth(c.Field), measureTextWidth(getMySQLPureType(c.Type))) + 32;

        return {
          title: (
            <span className={styles.tableTitle}>
              <span>{c.Field}</span>
              <span className={styles.type}>{getMySQLPureType(c.Type)}</span>
            </span>
          ),
          dataIndex: c.Field,
          render: (value: TMySQLRawData) => (
            <EllipsisText
              text={<MySQLRawDataDisplay type={c.Type} value={value} />}
              width={Math.max(250, columnWidth)}
            />
          ),
          width: columnWidth,
          ellipsis: true,
        };
      });

    const primaryKeys =
      getTableDataQuery.data?.columns.filter(col => col.Key === 'PRI').map(col => col.Field) || [];
    const tableData: Record<string, TMySQLRawData>[] =
      getTableDataQuery.data?.list.map(l => {
        const rowKey = primaryKeys.length ? primaryKeys.map(k => l[k]).join('-') : uuid.v4();
        return { ...l, [MOCK_Table_ROW_KEY]: rowKey };
      }) || [];

    return [columns, tableData];
  }, [getTableDataQuery.data]);

  const handleSearch = () => {
    setSelectedRowKeys([]);

    if (pagination?.current !== 1) {
      setPagination({ ...pagination, current: 1 });
    } else {
      getTableDataQuery.refetch();
    }
  };

  const handleReset = () => {
    setSelectedRowKeys([]);

    if (whereClause !== DEFAULT_WHERE_CLAUSE) {
      setWhereClause(DEFAULT_WHERE_CLAUSE);
      whereClauseRef.current = DEFAULT_WHERE_CLAUSE;
    }

    if (pagination?.current !== 1) {
      setPagination({ ...pagination, current: 1 });
    } else {
      getTableDataQuery.refetch();
    }
  };

  const handleSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys as string[]);
  };

  const handleEdit = (record: Record<string, TMySQLRawData>) => {
    const editKeys = [record[MOCK_Table_ROW_KEY]] as unknown as string[];
    const condition = getRowsCondition(editKeys);
    setEditorCondition(condition);
    setEditRow([record]);
  };

  const handleEditorSubmit = () => {
    setEditRow([]);
    getTableDataQuery.refetch();
  };

  const handleCloseEditor = () => {
    setEditRow([]);
  };

  const handleBatchEditorSubmit = () => {
    setEditRow([]);
    getTableDataQuery.refetch();
  };

  const handleCloseBatchEditor = () => {
    setEditRow([]);
  };

  const handleAfterExportData = () => {
    setExportVisible(false);
    setEditRow([]);
  };

  const handleAdd = () => {
    setEditRow([{}]);
  };

  const handleBatchEdit = () => {
    const row =
      tableData.filter(l => selectedRowKeys.includes(l[MOCK_Table_ROW_KEY] as unknown as string)) ||
      [];
    if (row.length === 0) {
      return;
    }
    const condition = getRowsCondition();
    setEditorCondition(condition);
    setEditRow(row);
  };

  const handleDelete = async () => {
    const condition = getRowsCondition();

    await batchDeleteDataMutation
      .mutateAsync({
        connectionId,
        dbName,
        tableName,
        condition,
      })
      .then(count => {
        showSuccess(t('mysql.affectedCount', { count }));
        handleReset();
      });
  };

  const handleExport = async () => {
    const condition = getRowsCondition();
    setEditorCondition(condition);
    setExportVisible(true);
  };

  const getRowsCondition = (keys = selectedRowKeys) => {
    const typeMap: Record<string, string> = {};
    getTableDataQuery.data?.columns.forEach(
      col => (typeMap[col.Field] = getMySQLPureType(col.Type)),
    );

    const condition: TMySQLCondition = [];
    const conditionKeys = primaryColumns.length
      ? primaryColumns.map(col => col.Field)
      : Object.keys(typeMap);
    const rows =
      tableData.filter(l => keys.includes(l[MOCK_Table_ROW_KEY] as unknown as string)) || [];
    rows.forEach(row => {
      const rowCondition: TMySQLCondition[number] = {};
      conditionKeys.forEach(k => {
        rowCondition[k] = getConditionValue(row[k], typeMap[k]);
      });
      condition.push(rowCondition);
    });

    return condition;
  };

  useEffect(() => {
    whereClauseRef.current = whereClause;
  }, [whereClause]);

  return (
    <div>
      <div className={styles.textBox}>
        <div className={styles.editor}>
          <CodeEditor
            language="sql"
            showLineNumbers={false}
            value={whereClause}
            onChange={setWhereClause}
            fields={getTableDataQuery.data?.columns.map(col => col.Field)}
          />
        </div>
        <Tooltip
          placement="right"
          title={
            <>
              <div>{t('mysql.whereTip1')}</div>
              <div>(1) WHERE id = 10 AND name LIKE '%cat%'</div>
              <div>(2) WHERE age &gt;= 18 ORDER BY age DESC</div>
              <div>(3) WHERE year IN ('2024','2025')</div>
              <div>{t('mysql.whereTip2')}</div>
            </>
          }
          styles={{ container: { width: '300px' } }}
        >
          <QuestionCircleOutlined className={styles.help} />
        </Tooltip>
      </div>

      <div className={styles.buttonGroup}>
        {getTableDataQuery.isSuccess && primaryColumns.length === 0 && (
          <Tooltip title={t('mysql.noPriTips')}>
            <WarningOutlined className={styles.warn} />
          </Tooltip>
        )}
        <Button onClick={handleAdd}>{t('button.add')}</Button>
        <Button disabled={!selectedRowKeys.length} onClick={handleBatchEdit}>
          {t('button.update')}
        </Button>
        <Popconfirm
          title={t('delete.title')}
          description={t('delete.desc')}
          onConfirm={handleDelete}
        >
          <Button disabled={!selectedRowKeys.length} danger>
            {t('button.delete')}
          </Button>
        </Popconfirm>
        <Button disabled={!selectedRowKeys.length} onClick={handleExport}>
          {t('button.export')}
        </Button>
        <Button onClick={handleReset}>{t('button.reset')}</Button>
        <Button type="primary" onClick={handleSearch}>
          {t('button.search')}
        </Button>
      </div>

      <Table
        className={styles.dataTable}
        rowKey={MOCK_Table_ROW_KEY}
        loading={getTableDataQuery.isLoading}
        columns={tableColumns}
        dataSource={tableData}
        scroll={{ x: 'max-content', y: '200px' }}
        pagination={{
          showSizeChanger: true,
          pageSizeOptions: [10, DEFAULT_PAGE_SIZE, 50, 100, 500],
          total: getTableDataQuery.data?.count || 0,
          current: pagination?.current,
          pageSize: pagination?.pageSize,
          defaultPageSize: DEFAULT_PAGE_SIZE,
          showTotal: total => t('mysql.total', { total }),
        }}
        onChange={setPagination}
        rowSelection={{
          columnWidth: 24,
          fixed: true,
          selectedRowKeys,
          onChange: handleSelectChange,
        }}
        onRow={record => {
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
        columns={getTableDataQuery.data?.columns || []}
        condition={editorCondition}
      />

      <BatchEditor
        onOk={handleBatchEditorSubmit}
        onCancel={handleCloseBatchEditor}
        show={!!editRow && editRow.length > 1}
        columns={getTableDataQuery.data?.columns || []}
        condition={editorCondition}
      />

      <ExportDataModal
        visible={exportVisible}
        condition={editorCondition}
        onOk={handleAfterExportData}
        onCancel={() => setExportVisible(false)}
        fields={(getTableDataQuery.data?.columns || []).map(c => c.Field)}
      />
    </div>
  );
};

export default TableData;
