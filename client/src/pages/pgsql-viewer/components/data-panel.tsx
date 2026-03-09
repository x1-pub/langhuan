import React, { useEffect } from 'react';
import { Button, Popconfirm, Space, Table, TableProps } from 'antd';
import { useTranslation } from 'react-i18next';

import styles from '../index.module.less';
import SqlWhereEditor from '@/components/sql-where-editor';
import {
  PGSQL_DEFAULT_PAGE_SIZE,
  PGSQL_TABLE_PAGE_SIZE_OPTIONS,
  type PgsqlTableRow,
} from '@/domain/pgsql/model/viewer';
import { PGSQL_WHERE_KEYWORDS } from '@/domain/pgsql/model/sql-keywords';
import useTableScrollY from '@/shared/ui/hooks/use-table-scroll-y';

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
  const { containerRef, scrollY, recalcScrollY } = useTableScrollY();

  useEffect(() => {
    recalcScrollY();
  }, [recalcScrollY, rows.length, columns?.length, total, current, pageSize, loading]);

  return (
    <div className={styles.panel}>
      <SqlWhereEditor
        value={whereDraft}
        fields={fields}
        keywords={PGSQL_WHERE_KEYWORDS}
        onChange={onChangeWhereDraft}
        tips={
          <>
            <div>{t('pgsql.whereTip1')}</div>
            <div>(1) WHERE id = 10 AND name LIKE '%cat%'</div>
            <div>(2) WHERE age &gt;= 18 ORDER BY age DESC</div>
            <div>(3) WHERE year IN ('2024','2025')</div>
            <div>{t('pgsql.whereTip2')}</div>
          </>
        }
      />

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

      <div className={styles.tableWrap} ref={containerRef}>
        <Table<PgsqlTableRow>
          rowKey="__pg_ctid"
          className={styles.dataTable}
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 'max-content', y: scrollY }}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: PGSQL_TABLE_PAGE_SIZE_OPTIONS,
            total,
            current,
            pageSize,
            defaultPageSize: PGSQL_DEFAULT_PAGE_SIZE,
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
