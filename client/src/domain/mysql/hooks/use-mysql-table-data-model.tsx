import { useEffect, useMemo, useState, type Key } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { TablePaginationConfig, TableProps } from 'antd';
import type { IMySQLColumn, TMySQLCondition, TMySQLRawData } from '@packages/types/mysql';

import useDatabaseWindows from '@/domain/workbench/state/database-window-state';
import {
  buildMySQLConditionFromRows,
  buildMySQLTableRows,
  getPrimaryColumnFields,
  MYSQL_COLUMN_MIN_DISPLAY_WIDTH,
  MYSQL_COLUMN_PADDING_WIDTH,
  MYSQL_DEFAULT_PAGE_SIZE,
  MYSQL_DEFAULT_WHERE_CLAUSE,
  MYSQL_PAGE_SIZE_OPTIONS,
  MYSQL_TABLE_ROW_KEY_FIELD,
  MYSQL_TABLE_SELECTION_COLUMN_WIDTH,
  sanitizeWhereClause,
  type MySQLTableDataPagination,
  type MySQLTableDataRow,
} from '@/domain/mysql/model/table-data';
import { getMySQLPureType } from '@/domain/mysql/model/mysql-value';
import { trpc } from '@/infra/api/trpc';
import { measureTextWidth } from '@/shared/dom/measure-text-width';
import { showSuccess } from '@/shared/ui/notifications';
import EllipsisText from '@/components/ellipsis-text';
import MySQLRawDataDisplay from '@/components/mysql-raw-data-display';

type MySQLEditorRow = Record<string, TMySQLRawData>;

interface UseMySQLTableDataModelResult {
  whereDraft: string;
  columns: IMySQLColumn[];
  fields: string[];
  total: number;
  loading: boolean;
  pagination: MySQLTableDataPagination;
  pageSizeOptions: number[];
  selectedRowKeys: string[];
  hasPrimaryKey: boolean;
  tableColumns: TableProps<MySQLTableDataRow>['columns'];
  tableRows: MySQLTableDataRow[];
  editorRows: MySQLEditorRow[];
  editorCondition: TMySQLCondition;
  exportVisible: boolean;
  selectionColumnWidth: number;
  changeWhereDraft: (value?: string) => void;
  applySearch: () => void;
  resetSearch: () => void;
  changePagination: (pagination: TablePaginationConfig) => void;
  changeSelectedRowKeys: (keys: Key[]) => void;
  openCreateEditor: () => void;
  openSingleEditor: (row: MySQLTableDataRow) => void;
  openBatchEditor: () => void;
  closeEditor: () => void;
  submitEditor: () => void;
  deleteSelectedRows: () => Promise<void>;
  openExportModal: () => void;
  closeExportModal: () => void;
}

const useMySQLTableDataModel = (): UseMySQLTableDataModelResult => {
  const { t } = useTranslation();
  const { connectionId, dbName, tableName } = useDatabaseWindows();
  const [pagination, setPagination] = useState<MySQLTableDataPagination>({
    current: 1,
    pageSize: MYSQL_DEFAULT_PAGE_SIZE,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [editorRows, setEditorRows] = useState<MySQLEditorRow[]>([]);
  const [editorCondition, setEditorCondition] = useState<TMySQLCondition>([]);
  const [exportVisible, setExportVisible] = useState(false);
  const [whereDraft, setWhereDraft] = useState(MYSQL_DEFAULT_WHERE_CLAUSE);
  const [whereApplied, setWhereApplied] = useState(MYSQL_DEFAULT_WHERE_CLAUSE);

  const batchDeleteDataMutation = useMutation(trpc.mysql.batchDeleteData.mutationOptions());
  const tableDataQuery = useQuery(
    trpc.mysql.getTableData.queryOptions(
      {
        connectionId,
        dbName,
        tableName,
        current: pagination.current,
        pageSize: pagination.pageSize,
        whereClause: whereApplied,
      },
      {
        enabled: Boolean(connectionId && dbName && tableName),
        staleTime: 5 * 60 * 1000,
      },
    ),
  );

  const columns = tableDataQuery.data?.columns || [];
  const primaryColumnFields = useMemo(() => getPrimaryColumnFields(columns), [columns]);
  const tableRows = useMemo(
    () =>
      buildMySQLTableRows({
        list: tableDataQuery.data?.list || [],
        columns,
        pagination,
      }),
    [columns, pagination, tableDataQuery.data?.list],
  );

  const tableColumns = useMemo<TableProps<MySQLTableDataRow>['columns']>(
    () =>
      columns.map(column => {
        const pureType = getMySQLPureType(column.Type);
        const columnWidth =
          Math.max(measureTextWidth(column.Field), measureTextWidth(pureType)) +
          MYSQL_COLUMN_PADDING_WIDTH;

        return {
          title: (
            <span style={{ display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' }}>
              <span>{column.Field}</span>
              <span
                style={{
                  color: 'var(--theme-table-column-type-color)',
                  fontWeight: 300,
                  fontSize: 12,
                }}
              >
                {pureType}
              </span>
            </span>
          ),
          dataIndex: column.Field,
          width: columnWidth,
          ellipsis: true,
          render: (value: TMySQLRawData) => (
            <EllipsisText
              text={<MySQLRawDataDisplay type={column.Type} value={value} />}
              width={Math.max(MYSQL_COLUMN_MIN_DISPLAY_WIDTH, columnWidth)}
            />
          ),
        };
      }),
    [columns],
  );

  const getRowsCondition = (keys = selectedRowKeys) =>
    buildMySQLConditionFromRows({
      columns,
      rows: tableRows,
      selectedRowKeys: keys,
    });

  const changeWhereDraft = (value?: string) => {
    setWhereDraft(value || '');
  };

  const applySearch = () => {
    const nextWhere = sanitizeWhereClause(whereDraft);
    const isSameWhereClause = nextWhere === whereApplied;

    if (whereDraft !== nextWhere) {
      setWhereDraft(nextWhere);
    }

    setSelectedRowKeys([]);
    setPagination(previous => ({
      ...previous,
      current: 1,
    }));

    if (isSameWhereClause) {
      if (pagination.current === 1) {
        void tableDataQuery.refetch();
      }
      return;
    }

    setWhereApplied(nextWhere);
  };

  const resetSearch = () => {
    const keepDefaultWhere = whereDraft === MYSQL_DEFAULT_WHERE_CLAUSE;
    const keepAppliedDefaultWhere = whereApplied === MYSQL_DEFAULT_WHERE_CLAUSE;

    if (!keepDefaultWhere) {
      setWhereDraft(MYSQL_DEFAULT_WHERE_CLAUSE);
    }

    setSelectedRowKeys([]);
    setPagination(previous => ({
      ...previous,
      current: 1,
    }));

    if (keepAppliedDefaultWhere) {
      if (pagination.current === 1 && keepDefaultWhere) {
        void tableDataQuery.refetch();
      }
      return;
    }

    setWhereApplied(MYSQL_DEFAULT_WHERE_CLAUSE);
  };

  const changePagination = (nextPagination: TablePaginationConfig) => {
    setPagination({
      current: nextPagination.current || 1,
      pageSize: nextPagination.pageSize || MYSQL_DEFAULT_PAGE_SIZE,
    });
  };

  const changeSelectedRowKeys = (keys: Key[]) => {
    setSelectedRowKeys(keys as string[]);
  };

  const openCreateEditor = () => {
    setEditorCondition([]);
    setEditorRows([{}]);
  };

  const openSingleEditor = (row: MySQLTableDataRow) => {
    const condition = getRowsCondition([row[MYSQL_TABLE_ROW_KEY_FIELD]]);
    setEditorCondition(condition);
    setEditorRows([row]);
  };

  const openBatchEditor = () => {
    const selectedRows = tableRows.filter(row =>
      selectedRowKeys.includes(row[MYSQL_TABLE_ROW_KEY_FIELD]),
    );

    if (!selectedRows.length) {
      return;
    }

    setEditorCondition(getRowsCondition());
    setEditorRows(selectedRows);
  };

  const closeEditor = () => {
    setEditorRows([]);
  };

  const submitEditor = () => {
    setEditorRows([]);
    void tableDataQuery.refetch();
  };

  const deleteSelectedRows = async () => {
    const condition = getRowsCondition();
    if (!condition.length) {
      return;
    }

    const count = await batchDeleteDataMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      condition,
    });

    showSuccess(t('mysql.affectedCount', { count }));
    setSelectedRowKeys([]);
    await tableDataQuery.refetch();
  };

  const openExportModal = () => {
    const condition = getRowsCondition();
    if (!condition.length) {
      return;
    }

    setEditorCondition(condition);
    setExportVisible(true);
  };

  const closeExportModal = () => {
    setExportVisible(false);
  };

  useEffect(() => {
    setPagination({ current: 1, pageSize: MYSQL_DEFAULT_PAGE_SIZE });
    setSelectedRowKeys([]);
    setEditorRows([]);
    setEditorCondition([]);
    setExportVisible(false);
    setWhereDraft(MYSQL_DEFAULT_WHERE_CLAUSE);
    setWhereApplied(MYSQL_DEFAULT_WHERE_CLAUSE);
  }, [dbName, tableName]);

  return {
    whereDraft,
    columns,
    fields: columns.map(column => column.Field),
    total: tableDataQuery.data?.count || 0,
    loading: tableDataQuery.isLoading,
    pagination,
    pageSizeOptions: MYSQL_PAGE_SIZE_OPTIONS,
    selectedRowKeys,
    hasPrimaryKey: primaryColumnFields.length > 0,
    tableColumns,
    tableRows,
    editorRows,
    editorCondition,
    exportVisible,
    selectionColumnWidth: MYSQL_TABLE_SELECTION_COLUMN_WIDTH,
    changeWhereDraft,
    applySearch,
    resetSearch,
    changePagination,
    changeSelectedRowKeys,
    openCreateEditor,
    openSingleEditor,
    openBatchEditor,
    closeEditor,
    submitEditor,
    deleteSelectedRows,
    openExportModal,
    closeExportModal,
  };
};

export default useMySQLTableDataModel;
