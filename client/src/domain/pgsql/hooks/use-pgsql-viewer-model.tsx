import { useEffect, useMemo, useState } from 'react';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import useDatabaseWindows from '@/domain/workbench/state/database-window-state';
import {
  normalizeWhereClause,
  PGSQL_COLUMN_MAX_WIDTH,
  PGSQL_COLUMN_MIN_WIDTH,
  PGSQL_DEFAULT_PAGE_SIZE,
  PGSQL_DEFAULT_WHERE_CLAUSE,
  PGSQL_ROW_EDITOR_DEFAULT_CONTENT,
  toSafeText,
  type PgsqlActiveTab,
  type PgsqlColumnInfo,
  type PgsqlIndexInfo,
  type PgsqlPartitionInfo,
  type PgsqlRowEditorState,
  type PgsqlTableRow,
  type PgsqlTriggerInfo,
} from '@/domain/pgsql/model/viewer';
import { trpc } from '@/infra/api/trpc';
import { measureTextWidth } from '@/shared/dom/measure-text-width';
import { showError, showSuccess } from '@/shared/ui/notifications';
import EllipsisText from '@/components/ellipsis-text';
import RawDataDisplay from '@/components/raw-data-display';

interface TableDataQueryResult {
  count: number;
  columns: PgsqlColumnInfo[];
  list: PgsqlTableRow[];
}

interface UsePgsqlViewerModelResult {
  validTableName: boolean;
  activeTab: PgsqlActiveTab;
  setActiveTab: (tab: PgsqlActiveTab) => void;
  dataPanelProps: {
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
    onDeleteRows: (ctids: string[]) => Promise<void>;
    onSelectedRowKeysChange: (keys: string[]) => void;
  };
  tableDesignPanelProps: {
    structureLoading: boolean;
    columns: PgsqlColumnInfo[];
    structureMutating: boolean;
    onCreateColumn: (value: {
      name: string;
      dataType: string;
      nullable: boolean;
      defaultValue?: string;
      comment?: string;
    }) => Promise<void>;
    onUpdateColumn: (
      oldName: string,
      value: {
        name: string;
        dataType: string;
        nullable: boolean;
        defaultValue?: string;
        comment?: string;
      },
    ) => Promise<void>;
    onDeleteColumn: (name: string) => Promise<void>;
    indexesLoading: boolean;
    indexes: PgsqlIndexInfo[];
    columnOptions: Array<{ label: string; value: string }>;
    isMutatingIndexes: boolean;
    onCreateIndex: (draft: {
      indexName: string;
      method: string;
      columns: string[];
      unique: boolean;
    }) => Promise<void>;
    onUpdateIndex: (
      oldName: string,
      draft: {
        indexName: string;
        method: string;
        columns: string[];
        unique: boolean;
      },
    ) => Promise<void>;
    onDropIndex: (indexName: string) => Promise<void>;
  };
  triggersPanelProps: {
    loading: boolean;
    triggers: PgsqlTriggerInfo[];
    isMutating: boolean;
    onCreate: (definition: string) => Promise<void>;
    onUpdate: (oldName: string, definition: string) => Promise<void>;
    onDelete: (name: string) => Promise<void>;
  };
  partitionsPanelProps: {
    loading: boolean;
    partitions: PgsqlPartitionInfo[];
    isMutating: boolean;
    onCreate: (partitionName: string, definition: string) => Promise<void>;
    onUpdate: (oldName: string, partitionName: string, definition: string) => Promise<void>;
    onDelete: (name: string) => Promise<void>;
  };
  tableDdlProps: {
    loading: boolean;
    ddl?: string;
  };
  statsPanelProps: {
    loading: boolean;
    stats?: Record<string, unknown>;
  };
  rowEditorModalProps: {
    open: boolean;
    mode: 'create' | 'edit';
    content: string;
    columns: PgsqlColumnInfo[];
    loading: boolean;
    onCancel: () => void;
    onSubmit: () => Promise<void>;
    onChangeContent: (value: string) => void;
  };
}

const usePgsqlViewerModel = (): UsePgsqlViewerModelResult => {
  const { t } = useTranslation();
  const { connectionId, dbName, tableName } = useDatabaseWindows();
  const [activeTab, setActiveTab] = useState<PgsqlActiveTab>('table-data');
  const [whereDraft, setWhereDraft] = useState(PGSQL_DEFAULT_WHERE_CLAUSE);
  const [queryApplied, setQueryApplied] = useState({
    where: normalizeWhereClause(PGSQL_DEFAULT_WHERE_CLAUSE),
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: PGSQL_DEFAULT_PAGE_SIZE });
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [rowEditor, setRowEditor] = useState<PgsqlRowEditorState | null>(null);

  const validTableName = !!tableName && tableName !== 'NO_TABLE';

  const tableDataQuery = useQuery(
    trpc.pgsql.getTableData.queryOptions(
      {
        connectionId,
        dbName,
        tableName: tableName || '',
        current: pagination.current,
        pageSize: pagination.pageSize,
        where: queryApplied.where || undefined,
      },
      { enabled: validTableName },
    ),
  );
  const tableColumnsQuery = useQuery(
    trpc.pgsql.getTableColumns.queryOptions(
      { connectionId, dbName, tableName: tableName || '' },
      { enabled: validTableName && activeTab === 'table-design' },
    ),
  );
  const tableIndexesQuery = useQuery(
    trpc.pgsql.getTableIndexes.queryOptions(
      { connectionId, dbName, tableName: tableName || '' },
      { enabled: validTableName && activeTab === 'table-design' },
    ),
  );
  const tableDdlQuery = useQuery(
    trpc.pgsql.getTableDDL.queryOptions(
      { connectionId, dbName, tableName: tableName || '' },
      { enabled: validTableName && activeTab === 'table-ddl' },
    ),
  );
  const tableStatsQuery = useQuery(
    trpc.pgsql.getTableStats.queryOptions(
      { connectionId, dbName, tableName: tableName || '' },
      { enabled: validTableName && activeTab === 'table-stats' },
    ),
  );
  const tableTriggersQuery = useQuery(
    trpc.pgsql.getTableTriggers.queryOptions(
      { connectionId, dbName, tableName: tableName || '' },
      { enabled: validTableName && activeTab === 'table-triggers' },
    ),
  );
  const tablePartitionsQuery = useQuery(
    trpc.pgsql.getTablePartitions.queryOptions(
      { connectionId, dbName, tableName: tableName || '' },
      { enabled: validTableName && activeTab === 'table-partitions' },
    ),
  );

  const insertRowMutation = useMutation(trpc.pgsql.insertRow.mutationOptions());
  const updateRowMutation = useMutation(trpc.pgsql.updateRow.mutationOptions());
  const deleteRowsMutation = useMutation(trpc.pgsql.deleteRows.mutationOptions());
  const addTableColumnMutation = useMutation(trpc.pgsql.addTableColumn.mutationOptions());
  const updateTableColumnMutation = useMutation(trpc.pgsql.updateTableColumn.mutationOptions());
  const deleteTableColumnMutation = useMutation(trpc.pgsql.deleteTableColumn.mutationOptions());
  const createIndexMutation = useMutation(trpc.pgsql.createTableIndex.mutationOptions());
  const updateIndexMutation = useMutation(trpc.pgsql.updateTableIndex.mutationOptions());
  const dropIndexMutation = useMutation(trpc.pgsql.dropTableIndex.mutationOptions());
  const createTriggerMutation = useMutation(trpc.pgsql.createTableTrigger.mutationOptions());
  const updateTriggerMutation = useMutation(trpc.pgsql.updateTableTrigger.mutationOptions());
  const deleteTriggerMutation = useMutation(trpc.pgsql.deleteTableTrigger.mutationOptions());
  const createPartitionMutation = useMutation(trpc.pgsql.createTablePartition.mutationOptions());
  const updatePartitionMutation = useMutation(trpc.pgsql.updateTablePartition.mutationOptions());
  const deletePartitionMutation = useMutation(trpc.pgsql.deleteTablePartition.mutationOptions());

  const tableData = tableDataQuery.data as TableDataQueryResult | undefined;
  const tableColumnsData = (tableColumnsQuery.data || []) as PgsqlColumnInfo[];
  const tableIndexesData = (tableIndexesQuery.data || []) as PgsqlIndexInfo[];
  const tableTriggersData = useMemo<PgsqlTriggerInfo[]>(
    () =>
      (tableTriggersQuery.data || []).map((item: Record<string, unknown>) => ({
        name: toSafeText(item.name),
        timing: toSafeText(item.timing),
        event: toSafeText(item.event),
        status: toSafeText(item.status),
        definition: toSafeText(item.definition),
      })),
    [tableTriggersQuery.data],
  );
  const tablePartitionsData = useMemo<PgsqlPartitionInfo[]>(
    () =>
      (tablePartitionsQuery.data || []).map((item: Record<string, unknown>) => ({
        name: toSafeText(item.name),
        strategy: toSafeText(item.strategy),
        partitionKey: toSafeText(item.partitionKey),
        bound: toSafeText(item.bound),
        totalSize: toSafeText(item.totalSize),
        liveRows: toSafeText(item.liveRows),
      })),
    [tablePartitionsQuery.data],
  );
  const tableRows = tableData?.list || [];

  const tableColumns = useMemo<TableProps<PgsqlTableRow>['columns']>(
    () =>
      (tableData?.columns || []).map(column => {
        const columnWidth = Math.min(
          PGSQL_COLUMN_MAX_WIDTH,
          Math.max(
            PGSQL_COLUMN_MIN_WIDTH,
            measureTextWidth(column.name) + measureTextWidth(column.dataType) + 56,
          ),
        );

        return {
          title: (
            <span style={{ display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' }}>
              <span>{column.isPrimaryKey ? `${column.name} (PK)` : column.name}</span>
              <span
                style={{
                  color: 'var(--theme-table-column-type-color)',
                  fontSize: 12,
                  fontWeight: 300,
                }}
              >
                {column.dataType}
              </span>
            </span>
          ),
          dataIndex: column.name,
          key: column.name,
          width: columnWidth,
          ellipsis: true,
          render: (value: unknown) => {
            if (value === null || value === undefined) {
              return '-';
            }

            return (
              <EllipsisText
                width={columnWidth - 24}
                text={<RawDataDisplay engine="pgsql" type={column.dataType} value={value} />}
              />
            );
          },
        };
      }),
    [tableData?.columns],
  );

  const indexColumnOptions = useMemo(() => {
    const columns = tableColumnsData.length ? tableColumnsData : tableData?.columns || [];
    return columns.map(column => ({
      label: column.name,
      value: column.name,
    }));
  }, [tableColumnsData, tableData?.columns]);

  const applyQuery = () => {
    const nextWhere = normalizeWhereClause(whereDraft);

    setPagination(previous => ({ ...previous, current: 1 }));
    setSelectedRowKeys([]);

    if (queryApplied.where === nextWhere) {
      if (pagination.current === 1) {
        void tableDataQuery.refetch();
      }
      return;
    }

    setQueryApplied({ where: nextWhere });
  };

  const resetQuery = () => {
    const defaultWhere = normalizeWhereClause(PGSQL_DEFAULT_WHERE_CLAUSE);
    const keepCurrentWhere = whereDraft === PGSQL_DEFAULT_WHERE_CLAUSE;

    if (!keepCurrentWhere) {
      setWhereDraft(PGSQL_DEFAULT_WHERE_CLAUSE);
    }
    setPagination(previous => ({ ...previous, current: 1 }));
    setSelectedRowKeys([]);

    if (queryApplied.where === defaultWhere) {
      if (pagination.current === 1 && keepCurrentWhere) {
        void tableDataQuery.refetch();
      }
      return;
    }

    setQueryApplied({ where: defaultWhere });
  };

  const openCreateEditor = () => {
    setRowEditor({
      mode: 'create',
      content: PGSQL_ROW_EDITOR_DEFAULT_CONTENT,
    });
  };

  const openEditEditor = (row: PgsqlTableRow) => {
    const { __pg_ctid, ...payload } = row;
    setRowEditor({
      mode: 'edit',
      ctid: __pg_ctid,
      content: JSON.stringify(payload, null, 2),
    });
  };

  const deleteRows = async (ctids: string[]) => {
    if (!ctids.length || !tableName) {
      return;
    }

    const count = await deleteRowsMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      ctids,
    });

    showSuccess(t('pgsql.deletedCount', { count }));
    setSelectedRowKeys([]);
    await tableDataQuery.refetch();
  };

  const submitEditor = async () => {
    if (!rowEditor || !tableName) {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rowEditor.content);
    } catch {
      showError({
        title: 'BAD_REQUEST',
        message: 'row must be valid JSON.',
      });
      return;
    }

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      showError({
        title: 'BAD_REQUEST',
        message: 'row must be a JSON object.',
      });
      return;
    }

    if (rowEditor.mode === 'create') {
      await insertRowMutation.mutateAsync({
        connectionId,
        dbName,
        tableName,
        row: JSON.stringify(parsed),
      });
      showSuccess(t('pgsql.insertSuccess'));
    } else {
      if (!rowEditor.ctid) {
        return;
      }
      await updateRowMutation.mutateAsync({
        connectionId,
        dbName,
        tableName,
        ctid: rowEditor.ctid,
        row: JSON.stringify(parsed),
      });
      showSuccess(t('pgsql.updateSuccess'));
    }

    setRowEditor(null);
    setSelectedRowKeys([]);
    await tableDataQuery.refetch();
  };

  const createTableColumn = async (value: {
    name: string;
    dataType: string;
    nullable: boolean;
    defaultValue?: string;
    comment?: string;
  }) => {
    if (!tableName) {
      return;
    }

    const columnName = value.name.trim();
    const dataType = value.dataType.trim();

    if (!columnName || !dataType) {
      showError({
        title: 'BAD_REQUEST',
        message: 'column name and data type are required.',
      });
      return;
    }

    await addTableColumnMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      name: columnName,
      dataType,
      nullable: value.nullable,
      defaultValue: value.defaultValue?.trim() || undefined,
      comment: value.comment?.trim() || undefined,
    });
    showSuccess(t('button.add'));
    await tableColumnsQuery.refetch();
  };

  const updateTableColumn = async (
    oldName: string,
    value: {
      name: string;
      dataType: string;
      nullable: boolean;
      defaultValue?: string;
      comment?: string;
    },
  ) => {
    if (!tableName) {
      return;
    }

    const columnName = value.name.trim();
    const dataType = value.dataType.trim();

    if (!columnName || !dataType) {
      showError({
        title: 'BAD_REQUEST',
        message: 'column name and data type are required.',
      });
      return;
    }

    await updateTableColumnMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      oldName,
      name: columnName,
      dataType,
      nullable: value.nullable,
      defaultValue: value.defaultValue?.trim() || undefined,
      comment: value.comment?.trim() || undefined,
    });
    showSuccess(t('button.update'));
    await tableColumnsQuery.refetch();
  };

  const deleteTableColumn = async (name: string) => {
    if (!tableName) {
      return;
    }

    await deleteTableColumnMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      name,
    });
    showSuccess(t('button.delete'));
    await tableColumnsQuery.refetch();
  };

  const createIndex = async (draft: {
    indexName: string;
    method: string;
    columns: string[];
    unique: boolean;
  }) => {
    if (!tableName) {
      return;
    }

    const indexName = draft.indexName.trim();
    if (!indexName) {
      showError({
        title: 'BAD_REQUEST',
        message: t('pgsql.indexNameRequired'),
      });
      return;
    }

    if (!draft.columns.length) {
      showError({
        title: 'BAD_REQUEST',
        message: t('pgsql.indexColumnsRequired'),
      });
      return;
    }

    await createIndexMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      indexName,
      columns: draft.columns,
      method: draft.method.trim() || 'btree',
      unique: draft.unique,
    });
    showSuccess(t('pgsql.createIndexSuccess'));
    await tableIndexesQuery.refetch();
  };

  const updateIndex = async (
    oldName: string,
    draft: {
      indexName: string;
      method: string;
      columns: string[];
      unique: boolean;
    },
  ) => {
    if (!tableName) {
      return;
    }

    const indexName = draft.indexName.trim();
    if (!indexName) {
      showError({
        title: 'BAD_REQUEST',
        message: t('pgsql.indexNameRequired'),
      });
      return;
    }

    if (!draft.columns.length) {
      showError({
        title: 'BAD_REQUEST',
        message: t('pgsql.indexColumnsRequired'),
      });
      return;
    }

    await updateIndexMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      oldName,
      indexName,
      columns: draft.columns,
      method: draft.method.trim() || 'btree',
      unique: draft.unique,
    });
    showSuccess(t('button.update'));
    await tableIndexesQuery.refetch();
  };

  const dropIndex = async (indexName: string) => {
    if (!tableName) {
      return;
    }

    await dropIndexMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      indexName,
    });
    showSuccess(t('pgsql.dropIndexSuccess'));
    await tableIndexesQuery.refetch();
  };

  const createTrigger = async (definition: string) => {
    if (!tableName) {
      return;
    }

    await createTriggerMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      definition,
    });
    showSuccess(t('pgsql.createTriggerSuccess'));
    await tableTriggersQuery.refetch();
  };

  const updateTrigger = async (oldName: string, definition: string) => {
    if (!tableName) {
      return;
    }

    await updateTriggerMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      oldName,
      definition,
    });
    showSuccess(t('pgsql.updateTriggerSuccess'));
    await tableTriggersQuery.refetch();
  };

  const deleteTrigger = async (name: string) => {
    if (!tableName) {
      return;
    }

    await deleteTriggerMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      name,
    });
    showSuccess(t('pgsql.deleteTriggerSuccess'));
    await tableTriggersQuery.refetch();
  };

  const createPartition = async (partitionName: string, definition: string) => {
    if (!tableName) {
      return;
    }

    await createPartitionMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      partitionName,
      definition,
    });
    showSuccess(t('pgsql.createPartitionSuccess'));
    await tablePartitionsQuery.refetch();
  };

  const updatePartition = async (oldName: string, partitionName: string, definition: string) => {
    if (!tableName) {
      return;
    }

    await updatePartitionMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      oldName,
      partitionName,
      definition,
    });
    showSuccess(t('pgsql.updatePartitionSuccess'));
    await tablePartitionsQuery.refetch();
  };

  const deletePartition = async (name: string) => {
    if (!tableName) {
      return;
    }

    await deletePartitionMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      name,
    });
    showSuccess(t('pgsql.deletePartitionSuccess'));
    await tablePartitionsQuery.refetch();
  };

  useEffect(() => {
    setActiveTab('table-data');
    setWhereDraft(PGSQL_DEFAULT_WHERE_CLAUSE);
    setQueryApplied({ where: normalizeWhereClause(PGSQL_DEFAULT_WHERE_CLAUSE) });
    setPagination({ current: 1, pageSize: PGSQL_DEFAULT_PAGE_SIZE });
    setSelectedRowKeys([]);
    setRowEditor(null);
  }, [dbName, tableName]);

  return {
    validTableName,
    activeTab,
    setActiveTab,
    dataPanelProps: {
      whereDraft,
      fields: (tableData?.columns || tableColumnsData).map(column => column.name),
      pageSize: pagination.pageSize,
      current: pagination.current,
      total: tableData?.count || 0,
      rows: tableRows,
      columns: tableColumns,
      loading: tableDataQuery.isLoading,
      selectedRowKeys,
      onChangeWhereDraft: value => setWhereDraft(value || ''),
      onApplyQuery: applyQuery,
      onResetQuery: resetQuery,
      onChangePage: (page, pageSize) => setPagination({ current: page, pageSize }),
      onOpenCreate: openCreateEditor,
      onOpenEdit: openEditEditor,
      onDeleteRows: deleteRows,
      onSelectedRowKeysChange: setSelectedRowKeys,
    },
    tableDesignPanelProps: {
      structureLoading: tableColumnsQuery.isLoading,
      columns: tableColumnsData,
      structureMutating:
        addTableColumnMutation.isPending ||
        updateTableColumnMutation.isPending ||
        deleteTableColumnMutation.isPending,
      onCreateColumn: createTableColumn,
      onUpdateColumn: updateTableColumn,
      onDeleteColumn: deleteTableColumn,
      indexesLoading: tableIndexesQuery.isLoading,
      indexes: tableIndexesData,
      columnOptions: indexColumnOptions,
      isMutatingIndexes:
        createIndexMutation.isPending ||
        updateIndexMutation.isPending ||
        dropIndexMutation.isPending,
      onCreateIndex: createIndex,
      onUpdateIndex: updateIndex,
      onDropIndex: dropIndex,
    },
    triggersPanelProps: {
      loading: tableTriggersQuery.isLoading,
      triggers: tableTriggersData,
      isMutating:
        createTriggerMutation.isPending ||
        updateTriggerMutation.isPending ||
        deleteTriggerMutation.isPending,
      onCreate: createTrigger,
      onUpdate: updateTrigger,
      onDelete: deleteTrigger,
    },
    partitionsPanelProps: {
      loading: tablePartitionsQuery.isLoading,
      partitions: tablePartitionsData,
      isMutating:
        createPartitionMutation.isPending ||
        updatePartitionMutation.isPending ||
        deletePartitionMutation.isPending,
      onCreate: createPartition,
      onUpdate: updatePartition,
      onDelete: deletePartition,
    },
    tableDdlProps: {
      loading: tableDdlQuery.isLoading,
      ddl: tableDdlQuery.data?.ddl,
    },
    statsPanelProps: {
      loading: tableStatsQuery.isLoading,
      stats: tableStatsQuery.data,
    },
    rowEditorModalProps: {
      open: !!rowEditor,
      mode: rowEditor?.mode || 'create',
      content: rowEditor?.content || PGSQL_ROW_EDITOR_DEFAULT_CONTENT,
      columns: (tableData?.columns || tableColumnsData) as PgsqlColumnInfo[],
      loading: insertRowMutation.isPending || updateRowMutation.isPending,
      onCancel: () => setRowEditor(null),
      onSubmit: submitEditor,
      onChangeContent: value =>
        setRowEditor(previous => {
          if (!previous) {
            return previous;
          }

          return {
            ...previous,
            content: value,
          };
        }),
    },
  };
};

export default usePgsqlViewerModel;
