import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, Typography, type TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import useDatabaseWindows from '@/hooks/use-database-windows';
import EllipsisText from '@/components/ellipsis-text';
import RawDataDisplay from '@/components/raw-data-display';
import { measureTextWidth } from '@/utils/measure-text-width';
import { showError, showSuccess } from '@/utils/global-notification';
import { trpc } from '@/utils/trpc';
import styles from '../index.module.less';
import DataPanel, { PgsqlTableRow } from './data-panel';
import TableDesignPanel from './table-design-panel';
import TableDDL from './table-ddl';
import StatsPanel from './stats-panel';
import RowEditorModal from './row-editor-modal';
import TriggersPanel from './triggers-panel';
import PartitionsPanel from './partitions-panel';

type TActiveTab =
  | 'table-data'
  | 'table-design'
  | 'table-triggers'
  | 'table-partitions'
  | 'table-ddl'
  | 'table-stats';

interface IRowEditorState {
  mode: 'create' | 'edit';
  ctid?: string;
  content: string;
}

interface IPgsqlColumnInfo {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue: string | null;
  comment: string | null;
  isPrimaryKey: boolean;
  isIdentity: boolean;
  identityGeneration: 'ALWAYS' | 'BY DEFAULT' | null;
}

interface IPgsqlIndexInfo {
  name: string;
  definition: string;
}

const defaultRowEditorContent = '{\n  \n}';
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_WHERE_CLAUSE = 'WHERE 1 = 1';
const PGSQL_COLUMN_MIN_WIDTH = 180;
const PGSQL_COLUMN_MAX_WIDTH = 380;
const toSafeText = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
};
const normalizeWhereClause = (value: string) => {
  const trimmed = value.trim().replace(/;+\s*$/, '');
  if (!trimmed) {
    return '';
  }

  return trimmed.replace(/^where\s+/i, '').trim();
};

const Viewer: React.FC = () => {
  const { t } = useTranslation();
  const { connectionId, dbName, tableName } = useDatabaseWindows();

  const [activeTab, setActiveTab] = useState<TActiveTab>('table-data');
  const [whereDraft, setWhereDraft] = useState(DEFAULT_WHERE_CLAUSE);
  const [queryApplied, setQueryApplied] = useState({
    where: normalizeWhereClause(DEFAULT_WHERE_CLAUSE),
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: DEFAULT_PAGE_SIZE });
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [rowEditor, setRowEditor] = useState<IRowEditorState | null>(null);
  const [indexDraft, setIndexDraft] = useState({
    indexName: '',
    method: 'btree',
    columns: [] as string[],
    unique: false,
  });

  const validTableName = !!tableName && tableName !== 'NO_TABLE';

  const getTableDataQuery = useQuery(
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
  const getTableColumnsQuery = useQuery(
    trpc.pgsql.getTableColumns.queryOptions(
      {
        connectionId,
        dbName,
        tableName: tableName || '',
      },
      {
        enabled: validTableName && activeTab === 'table-design',
      },
    ),
  );
  const getTableIndexesQuery = useQuery(
    trpc.pgsql.getTableIndexes.queryOptions(
      {
        connectionId,
        dbName,
        tableName: tableName || '',
      },
      { enabled: validTableName && activeTab === 'table-design' },
    ),
  );
  const getTableDDLQuery = useQuery(
    trpc.pgsql.getTableDDL.queryOptions(
      {
        connectionId,
        dbName,
        tableName: tableName || '',
      },
      { enabled: validTableName && activeTab === 'table-ddl' },
    ),
  );
  const getTableStatsQuery = useQuery(
    trpc.pgsql.getTableStats.queryOptions(
      {
        connectionId,
        dbName,
        tableName: tableName || '',
      },
      { enabled: validTableName && activeTab === 'table-stats' },
    ),
  );
  const getTableTriggersQuery = useQuery(
    trpc.pgsql.getTableTriggers.queryOptions(
      {
        connectionId,
        dbName,
        tableName: tableName || '',
      },
      { enabled: validTableName && activeTab === 'table-triggers' },
    ),
  );
  const getTablePartitionsQuery = useQuery(
    trpc.pgsql.getTablePartitions.queryOptions(
      {
        connectionId,
        dbName,
        tableName: tableName || '',
      },
      { enabled: validTableName && activeTab === 'table-partitions' },
    ),
  );

  const insertRowMutation = useMutation(trpc.pgsql.insertRow.mutationOptions());
  const updateRowMutation = useMutation(trpc.pgsql.updateRow.mutationOptions());
  const deleteRowsMutation = useMutation(trpc.pgsql.deleteRows.mutationOptions());
  const createIndexMutation = useMutation(trpc.pgsql.createTableIndex.mutationOptions());
  const dropIndexMutation = useMutation(trpc.pgsql.dropTableIndex.mutationOptions());
  const createTriggerMutation = useMutation(trpc.pgsql.createTableTrigger.mutationOptions());
  const updateTriggerMutation = useMutation(trpc.pgsql.updateTableTrigger.mutationOptions());
  const deleteTriggerMutation = useMutation(trpc.pgsql.deleteTableTrigger.mutationOptions());
  const createPartitionMutation = useMutation(trpc.pgsql.createTablePartition.mutationOptions());
  const updatePartitionMutation = useMutation(trpc.pgsql.updateTablePartition.mutationOptions());
  const deletePartitionMutation = useMutation(trpc.pgsql.deleteTablePartition.mutationOptions());
  const tableData = getTableDataQuery.data as
    | {
        count: number;
        columns: IPgsqlColumnInfo[];
        list: PgsqlTableRow[];
      }
    | undefined;
  const tableColumnsData = (getTableColumnsQuery.data || []) as IPgsqlColumnInfo[];
  const tableIndexesData = (getTableIndexesQuery.data || []) as IPgsqlIndexInfo[];
  const tableTriggersData = useMemo(() => {
    return (getTableTriggersQuery.data || []).map((item: Record<string, unknown>) => ({
      name: toSafeText(item.name),
      timing: toSafeText(item.timing),
      event: toSafeText(item.event),
      status: toSafeText(item.status),
      definition: toSafeText(item.definition),
    }));
  }, [getTableTriggersQuery.data]);
  const tablePartitionsData = useMemo(() => {
    return (getTablePartitionsQuery.data || []).map((item: Record<string, unknown>) => ({
      name: toSafeText(item.name),
      strategy: toSafeText(item.strategy),
      partitionKey: toSafeText(item.partitionKey),
      bound: toSafeText(item.bound),
      totalSize: toSafeText(item.totalSize),
      liveRows: toSafeText(item.liveRows),
    }));
  }, [getTablePartitionsQuery.data]);

  const tableRows = useMemo(() => {
    return tableData?.list || [];
  }, [tableData?.list]);

  const dynamicColumns: TableProps<PgsqlTableRow>['columns'] = (tableData?.columns || []).map(
    (column: IPgsqlColumnInfo) => {
      const columnWidth = Math.min(
        PGSQL_COLUMN_MAX_WIDTH,
        Math.max(
          PGSQL_COLUMN_MIN_WIDTH,
          measureTextWidth(column.name) + measureTextWidth(column.dataType) + 56,
        ),
      );

      return {
        title: (
          <span className={styles.tableTitle}>
            <span>{column.isPrimaryKey ? `${column.name} (PK)` : column.name}</span>
            <span className={styles.type}>{column.dataType}</span>
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
    },
  );

  const tableColumns: TableProps<PgsqlTableRow>['columns'] = dynamicColumns;

  const indexColumnOptions = useMemo(() => {
    const columns = tableColumnsData.length ? tableColumnsData : tableData?.columns || [];
    return columns.map((column: IPgsqlColumnInfo) => ({
      label: column.name,
      value: column.name,
    }));
  }, [tableColumnsData, tableData?.columns]);

  const handleApplyQuery = () => {
    const nextWhere = normalizeWhereClause(whereDraft);

    setPagination(prev => ({ ...prev, current: 1 }));
    setSelectedRowKeys([]);

    if (queryApplied.where === nextWhere) {
      if (pagination.current === 1) {
        getTableDataQuery.refetch();
      }
      return;
    }

    setQueryApplied({ where: nextWhere });
  };

  const handleResetQuery = () => {
    const defaultWhere = normalizeWhereClause(DEFAULT_WHERE_CLAUSE);
    const keepCurrentWhere = whereDraft === DEFAULT_WHERE_CLAUSE;

    if (!keepCurrentWhere) {
      setWhereDraft(DEFAULT_WHERE_CLAUSE);
    }
    setPagination(prev => ({ ...prev, current: 1 }));
    setSelectedRowKeys([]);

    if (queryApplied.where === defaultWhere) {
      if (pagination.current === 1 && keepCurrentWhere) {
        getTableDataQuery.refetch();
      }
      return;
    }

    setQueryApplied({ where: defaultWhere });
  };

  const handleOpenCreate = () => {
    setRowEditor({
      mode: 'create',
      content: defaultRowEditorContent,
    });
  };

  function handleOpenEdit(row: PgsqlTableRow) {
    const { __pg_ctid, ...payload } = row;
    setRowEditor({
      mode: 'edit',
      ctid: __pg_ctid,
      content: JSON.stringify(payload, null, 2),
    });
  }

  async function handleDeleteRows(ctids: string[]) {
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
    getTableDataQuery.refetch();
  }

  const handleSubmitRow = async () => {
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
    getTableDataQuery.refetch();
  };

  const handleCreateIndex = async () => {
    if (!tableName) {
      return;
    }

    const indexName = indexDraft.indexName.trim();
    if (!indexName) {
      showError({
        title: 'BAD_REQUEST',
        message: t('pgsql.indexNameRequired'),
      });
      return;
    }

    if (!indexDraft.columns.length) {
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
      columns: indexDraft.columns,
      method: indexDraft.method.trim() || 'btree',
      unique: indexDraft.unique,
    });
    showSuccess(t('pgsql.createIndexSuccess'));
    setIndexDraft({
      indexName: '',
      method: 'btree',
      columns: [],
      unique: false,
    });
    getTableIndexesQuery.refetch();
  };

  const handleDropIndex = async (indexName: string) => {
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
    getTableIndexesQuery.refetch();
  };

  const handleCreateTrigger = async (definition: string) => {
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
    getTableTriggersQuery.refetch();
  };

  const handleUpdateTrigger = async (oldName: string, definition: string) => {
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
    getTableTriggersQuery.refetch();
  };

  const handleDeleteTrigger = async (name: string) => {
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
    getTableTriggersQuery.refetch();
  };

  const handleCreatePartition = async (partitionName: string, definition: string) => {
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
    getTablePartitionsQuery.refetch();
  };

  const handleUpdatePartition = async (
    oldName: string,
    partitionName: string,
    definition: string,
  ) => {
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
    getTablePartitionsQuery.refetch();
  };

  const handleDeletePartition = async (name: string) => {
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
    getTablePartitionsQuery.refetch();
  };

  useEffect(() => {
    setActiveTab('table-data');
    setWhereDraft(DEFAULT_WHERE_CLAUSE);
    setQueryApplied({ where: normalizeWhereClause(DEFAULT_WHERE_CLAUSE) });
    setPagination({ current: 1, pageSize: DEFAULT_PAGE_SIZE });
    setSelectedRowKeys([]);
    setRowEditor(null);
    setIndexDraft({
      indexName: '',
      method: 'btree',
      columns: [],
      unique: false,
    });
  }, [dbName, tableName]);

  if (!validTableName) {
    return (
      <div className={styles.empty}>
        <Typography.Text strong={true}>{t('pgsql.noTableSelected')}</Typography.Text>
      </div>
    );
  }

  return (
    <div className={styles.pgsqlWrap}>
      <Tabs
        activeKey={activeTab}
        tabPlacement="start"
        className={styles.pgsqlTabs}
        onChange={key => setActiveTab(key as TActiveTab)}
        items={[
          {
            key: 'table-data',
            label: t('mysql.data'),
            children: (
              <DataPanel
                whereDraft={whereDraft}
                fields={(tableData?.columns || tableColumnsData).map(column => column.name)}
                pageSize={pagination.pageSize}
                current={pagination.current}
                total={tableData?.count || 0}
                rows={tableRows}
                columns={tableColumns}
                loading={getTableDataQuery.isLoading}
                selectedRowKeys={selectedRowKeys}
                onChangeWhereDraft={value => setWhereDraft(value || '')}
                onApplyQuery={handleApplyQuery}
                onResetQuery={handleResetQuery}
                onChangePage={(page, pageSize) => setPagination({ current: page, pageSize })}
                onOpenCreate={handleOpenCreate}
                onOpenEdit={handleOpenEdit}
                onDeleteRows={handleDeleteRows}
                onSelectedRowKeysChange={keys => setSelectedRowKeys(keys)}
              />
            ),
          },
          {
            key: 'table-design',
            label: t('mysql.design'),
            children: (
              <TableDesignPanel
                structureLoading={getTableColumnsQuery.isLoading}
                columns={tableColumnsData}
                indexesLoading={getTableIndexesQuery.isLoading}
                indexes={tableIndexesData}
                columnOptions={indexColumnOptions}
                draft={indexDraft}
                isCreating={createIndexMutation.isPending}
                isDropping={dropIndexMutation.isPending}
                onChangeDraft={partial => setIndexDraft(prev => ({ ...prev, ...partial }))}
                onCreateIndex={handleCreateIndex}
                onDropIndex={handleDropIndex}
              />
            ),
          },
          {
            key: 'table-triggers',
            label: t('mysql.trigger'),
            children: (
              <TriggersPanel
                loading={getTableTriggersQuery.isLoading}
                triggers={tableTriggersData}
                isMutating={
                  createTriggerMutation.isPending ||
                  updateTriggerMutation.isPending ||
                  deleteTriggerMutation.isPending
                }
                onCreate={handleCreateTrigger}
                onUpdate={handleUpdateTrigger}
                onDelete={handleDeleteTrigger}
              />
            ),
          },
          {
            key: 'table-partitions',
            label: t('mysql.partition'),
            children: (
              <PartitionsPanel
                loading={getTablePartitionsQuery.isLoading}
                partitions={tablePartitionsData}
                isMutating={
                  createPartitionMutation.isPending ||
                  updatePartitionMutation.isPending ||
                  deletePartitionMutation.isPending
                }
                onCreate={handleCreatePartition}
                onUpdate={handleUpdatePartition}
                onDelete={handleDeletePartition}
              />
            ),
          },
          {
            key: 'table-ddl',
            label: t('mysql.ddl'),
            children: (
              <TableDDL loading={getTableDDLQuery.isLoading} ddl={getTableDDLQuery.data?.ddl} />
            ),
          },
          {
            key: 'table-stats',
            label: t('mysql.status'),
            children: (
              <StatsPanel loading={getTableStatsQuery.isLoading} stats={getTableStatsQuery.data} />
            ),
          },
        ]}
      />

      <RowEditorModal
        open={!!rowEditor}
        mode={rowEditor?.mode || 'create'}
        content={rowEditor?.content || defaultRowEditorContent}
        columns={(tableData?.columns || tableColumnsData) as IPgsqlColumnInfo[]}
        loading={insertRowMutation.isPending || updateRowMutation.isPending}
        onCancel={() => setRowEditor(null)}
        onSubmit={handleSubmitRow}
        onChangeContent={value =>
          setRowEditor(prev => {
            if (!prev) {
              return prev;
            }
            return {
              ...prev,
              content: value,
            };
          })
        }
      />
    </div>
  );
};

export default Viewer;
