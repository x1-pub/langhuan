import React, { Suspense } from 'react';
import { Badge, Button, Popconfirm, Space, Spin, Table, TableProps } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import styles from '../index.module.less';
const LazyCodeEditor = React.lazy(() => import('@/components/code-editor'));
const PGSQL_TABLE_SCROLL_Y = 'calc(100vh - 430px)';

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
  onRefresh: () => void;
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
  onRefresh,
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
      </div>

      <div className={styles.buttonGroup}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>
            {t('button.refresh')}
          </Button>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={onApplyQuery}>
            {t('button.search')}
          </Button>
          <Button onClick={onResetQuery}>{t('button.reset')}</Button>
        </Space>
      </div>

      <div className={styles.toolbar}>
        <Space>
          <Button type="dashed" icon={<PlusOutlined />} onClick={onOpenCreate}>
            {t('pgsql.createRow')}
          </Button>
          <Button
            icon={<EditOutlined />}
            disabled={selectedRows.length !== 1}
            onClick={() => {
              if (selectedRows[0]) {
                onOpenEdit(selectedRows[0]);
              }
            }}
          >
            {t('button.edit')}
          </Button>
          <Popconfirm
            title={t('delete.title')}
            description={t('delete.desc')}
            disabled={selectedRows.length === 0}
            onConfirm={() => onDeleteRows(selectedRows.map(row => row.__pg_ctid))}
          >
            <Button danger={true} icon={<DeleteOutlined />} disabled={selectedRows.length === 0}>
              {t('button.delete')}
            </Button>
          </Popconfirm>
        </Space>
        <Badge color="var(--theme-main-color)" text={t('pgsql.total', { total })} />
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
