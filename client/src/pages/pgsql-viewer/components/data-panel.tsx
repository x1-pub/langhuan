import React, { Suspense } from 'react';
import { Button, Popconfirm, Space, Spin, Table, TableProps, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import styles from '../index.module.less';
const LazyCodeEditor = React.lazy(() => import('@/components/code-editor'));
const PGSQL_TABLE_SCROLL_Y = 'calc(100vh - 380px)';

export interface PgsqlTableRow {
  __pg_ctid: string;
  [key: string]: unknown;
}

interface DataPanelProps {
  whereDraft: string;
  fields: string[];
  current: number;
  pageSize: number;
  total: number;
  rows: PgsqlTableRow[];
  columns: TableProps<PgsqlTableRow>['columns'];
  loading: boolean;
  selectedRowKeys: string[];
  onChangeWhereDraft: (value?: string) => void;
  onApplyQuery: () => void;
  onResetQuery: () => void;
  onChangePage: (page: number, pageSize: number) => void;
  onOpenCreate: () => void;
  onOpenEdit: (row: PgsqlTableRow) => void;
  onDeleteRows: (ctids: string[]) => void;
  onSelectedRowKeysChange: (keys: string[]) => void;
}

const DataPanel: React.FC<DataPanelProps> = ({
  whereDraft,
  fields,
  current,
  pageSize,
  total,
  rows,
  columns,
  loading,
  selectedRowKeys,
  onChangeWhereDraft,
  onApplyQuery,
  onResetQuery,
  onChangePage,
  onOpenCreate,
  onOpenEdit,
  onDeleteRows,
  onSelectedRowKeysChange,
}) => {
  const { t } = useTranslation();
  const selectedRows = rows.filter(row => selectedRowKeys.includes(row.__pg_ctid));

  return (
    <div className={styles.panel}>
      <div className={styles.textBox}>
        <div className={styles.editor}>
          <Suspense fallback={<Spin size="small" className={styles.spin} />}>
            <LazyCodeEditor
              language="sql"
              showLineNumbers={false}
              value={whereDraft}
              onChange={onChangeWhereDraft}
              fields={fields}
            />
          </Suspense>
        </div>
        <Tooltip
          placement="right"
          title={
            <>
              <div>{t('pgsql.whereTip1')}</div>
              <div>(1) WHERE id = 10 AND name LIKE '%cat%'</div>
              <div>(2) WHERE age &gt;= 18 ORDER BY age DESC</div>
              <div>(3) WHERE year IN ('2024','2025')</div>
              <div>{t('pgsql.whereTip2')}</div>
            </>
          }
          styles={{ container: { width: '300px' } }}
        >
          <QuestionCircleOutlined className={styles.help} />
        </Tooltip>
      </div>

      <div className={styles.buttonGroup}>
        <Space>
          <Button onClick={onOpenCreate}>{t('button.add')}</Button>
          <Button
            disabled={selectedRows.length !== 1}
            onClick={() => {
              if (selectedRows[0]) {
                onOpenEdit(selectedRows[0]);
              }
            }}
          >
            {t('button.update')}
          </Button>
          <Popconfirm
            title={t('delete.title')}
            description={t('delete.desc')}
            disabled={selectedRows.length === 0}
            onConfirm={() => onDeleteRows(selectedRows.map(row => row.__pg_ctid))}
          >
            <Button danger={true} disabled={selectedRows.length === 0}>
              {t('button.delete')}
            </Button>
          </Popconfirm>
          <Button onClick={onResetQuery}>{t('button.reset')}</Button>
          <Button type="primary" onClick={onApplyQuery}>
            {t('button.search')}
          </Button>
        </Space>
      </div>

      <div className={styles.tableWrap}>
        <Table<PgsqlTableRow>
          rowKey="__pg_ctid"
          className={styles.dataTable}
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 'max-content', y: PGSQL_TABLE_SCROLL_Y }}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100, 500],
            total,
            current,
            pageSize,
            defaultPageSize: 20,
            showTotal: all => t('pgsql.total', { total: all }),
          }}
          onChange={pagination => {
            onChangePage(pagination.current || 1, pagination.pageSize || pageSize);
          }}
          rowSelection={{
            fixed: true,
            columnWidth: 24,
            selectedRowKeys,
            onChange: keys => onSelectedRowKeysChange(keys as string[]),
          }}
          onRow={record => ({
            onDoubleClick: () => onOpenEdit(record),
          })}
        />
      </div>
    </div>
  );
};

export default DataPanel;
