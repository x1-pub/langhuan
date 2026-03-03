import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Button, Popconfirm, Space, type TableProps } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { showError, showSuccess } from '@/shared/ui/notifications';
import { trpc } from '@/infra/api/trpc';
import type { DocumentsPanelProps } from '../../panels/documents-panel';
import {
  DEFAULT_DOCUMENT,
  DEFAULT_QUERY_STATE,
  encodeRowKey,
  IDocumentEditorState,
  IDocumentQueryState,
  IMongoTableRow,
  ROW_KEY_FIELD,
  TDocumentViewMode,
  TMongoDocument,
} from '../../shared';
import { buildDynamicColumns, parseJSONObject } from '../utils';

interface UseMongoDocumentsModelParams {
  connectionId: number;
  dbName: string;
  tableName?: string;
  validTableName: boolean;
}

export interface DocumentEditorModalModelProps {
  documentEditor: IDocumentEditorState | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  onChangeContent: (value: string) => void;
}

interface UseMongoDocumentsModelResult {
  documentsPanelProps: DocumentsPanelProps;
  documentEditorModalProps: DocumentEditorModalModelProps;
}

const useMongoDocumentsModel = ({
  connectionId,
  dbName,
  tableName,
  validTableName,
}: UseMongoDocumentsModelParams): UseMongoDocumentsModelResult => {
  const { t } = useTranslation();
  const [docViewMode, setDocViewMode] = useState<TDocumentViewMode>('list');
  const [queryDraft, setQueryDraft] = useState<IDocumentQueryState>(DEFAULT_QUERY_STATE);
  const [queryApplied, setQueryApplied] = useState<IDocumentQueryState>(DEFAULT_QUERY_STATE);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [documentEditor, setDocumentEditor] = useState<IDocumentEditorState | null>(null);
  const [listExpandedMap, setListExpandedMap] = useState<Record<string, boolean>>({});

  const getCollectionDataQuery = useQuery(
    trpc.mongodb.getCollectionData.queryOptions(
      {
        connectionId,
        dbName,
        tableName: tableName || '',
        filter: queryApplied.filter,
        projection: queryApplied.projection,
        sort: queryApplied.sort,
        limit: queryApplied.limit,
        skip: queryApplied.skip,
        current: Math.floor(queryApplied.skip / queryApplied.limit) + 1,
        pageSize: queryApplied.limit,
      },
      {
        enabled: !!connectionId && !!dbName && validTableName,
      },
    ),
  );

  const insertDocumentMutation = useMutation(trpc.mongodb.insertDocument.mutationOptions());
  const updateDocumentMutation = useMutation(trpc.mongodb.updateDocument.mutationOptions());
  const deleteDocumentsMutation = useMutation(trpc.mongodb.deleteDocuments.mutationOptions());

  const documentRows = useMemo<IMongoTableRow[]>(() => {
    return (getCollectionDataQuery.data?.list || []).map((document, index) => {
      const item = document as TMongoDocument;
      return {
        ...item,
        [ROW_KEY_FIELD]: encodeRowKey(item._id, index, 'doc'),
      } as IMongoTableRow;
    });
  }, [getCollectionDataQuery.data?.list]);

  const rowMap = useMemo(() => {
    return documentRows.reduce<Record<string, IMongoTableRow>>((acc, row) => {
      acc[row[ROW_KEY_FIELD]] = row;
      return acc;
    }, {});
  }, [documentRows]);

  const selectedRows = useMemo(() => {
    return selectedRowKeys.map(key => rowMap[key]).filter((item): item is IMongoTableRow => !!item);
  }, [selectedRowKeys, rowMap]);

  const handleDeleteByIds = async (ids: unknown[]) => {
    if (!tableName || ids.length === 0) {
      return;
    }

    const count = await deleteDocumentsMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      ids,
    });

    showSuccess(t('mongodb.deletedCount', { count }));
    setSelectedRowKeys([]);
    getCollectionDataQuery.refetch();
  };

  const handleOpenEdit = (row: IMongoTableRow) => {
    const document = { ...row } as Record<string, unknown>;
    delete document[ROW_KEY_FIELD];
    setDocumentEditor({
      mode: 'edit',
      id: document._id,
      content: JSON.stringify(document, null, 2),
    });
  };

  const handleOpenCreate = () => {
    setDocumentEditor({
      mode: 'create',
      content: DEFAULT_DOCUMENT,
    });
  };

  const documentColumns = useMemo<TableProps<IMongoTableRow>['columns']>(() => {
    return [
      ...buildDynamicColumns(documentRows),
      {
        title: t('table.operation'),
        key: 'actions',
        fixed: 'right',
        width: 120,
        render: (_value, row) => {
          const disableEdit = row._id === undefined;
          return (
            <Space size={4}>
              <Button
                type="text"
                icon={<EditOutlined />}
                disabled={disableEdit}
                onClick={() => handleOpenEdit(row)}
              />
              <Popconfirm
                title={t('delete.title')}
                description={t('delete.desc')}
                disabled={disableEdit}
                onConfirm={() => {
                  if (row._id !== undefined) {
                    handleDeleteByIds([row._id]);
                  }
                }}
              >
                <Button
                  type="text"
                  danger={true}
                  icon={<DeleteOutlined />}
                  disabled={disableEdit}
                />
              </Popconfirm>
            </Space>
          );
        },
      },
    ];
  }, [documentRows, t]);

  const syncQueryAndFetch = (nextState: IDocumentQueryState) => {
    // Keep draft/applied query in sync and clear stale row selection.
    setQueryDraft(nextState);
    setQueryApplied(nextState);
    setSelectedRowKeys([]);
  };

  const handleApplyQuery = () => {
    // Validate three JSON query fragments before issuing request.
    if (!parseJSONObject(queryDraft.filter, t('mongodb.filter'), t)) {
      return;
    }
    if (!parseJSONObject(queryDraft.projection, t('mongodb.project'), t)) {
      return;
    }
    if (!parseJSONObject(queryDraft.sort, t('mongodb.sort'), t)) {
      return;
    }

    const safeLimit = Math.max(1, queryDraft.limit);
    const safeSkip = Math.max(0, queryDraft.skip);
    const nextState = {
      ...queryDraft,
      limit: safeLimit,
      skip: safeSkip,
    };
    const shouldRefetch =
      nextState.filter === queryApplied.filter &&
      nextState.projection === queryApplied.projection &&
      nextState.sort === queryApplied.sort &&
      nextState.limit === queryApplied.limit &&
      nextState.skip === queryApplied.skip;

    syncQueryAndFetch(nextState);
    if (shouldRefetch) {
      getCollectionDataQuery.refetch();
    }
  };

  const handleResetQuery = () => {
    const shouldRefetch =
      queryApplied.filter === DEFAULT_QUERY_STATE.filter &&
      queryApplied.projection === DEFAULT_QUERY_STATE.projection &&
      queryApplied.sort === DEFAULT_QUERY_STATE.sort &&
      queryApplied.limit === DEFAULT_QUERY_STATE.limit &&
      queryApplied.skip === DEFAULT_QUERY_STATE.skip;

    syncQueryAndFetch({ ...DEFAULT_QUERY_STATE });
    if (shouldRefetch) {
      getCollectionDataQuery.refetch();
    }
  };

  const handleSkipMove = (direction: 'prev' | 'next') => {
    const nextSkip =
      direction === 'prev'
        ? Math.max(0, queryApplied.skip - queryApplied.limit)
        : queryApplied.skip + queryApplied.limit;

    syncQueryAndFetch({
      ...queryApplied,
      skip: nextSkip,
    });
  };

  const handleTablePageChange = (page: number, pageSize: number) => {
    const safeLimit = Math.max(1, Math.min(500, pageSize || queryApplied.limit));
    const safeCurrent = Math.max(1, page || 1);
    const nextSkip = (safeCurrent - 1) * safeLimit;
    const shouldRefetch = nextSkip === queryApplied.skip && safeLimit === queryApplied.limit;

    syncQueryAndFetch({
      ...queryApplied,
      limit: safeLimit,
      skip: nextSkip,
    });
    if (shouldRefetch) {
      getCollectionDataQuery.refetch();
    }
  };

  const handleToggleRowSelection = (rowKey: string, checked: boolean) => {
    setSelectedRowKeys(prev => {
      if (checked) {
        if (prev.includes(rowKey)) {
          return prev;
        }
        return [...prev, rowKey];
      }

      return prev.filter(item => item !== rowKey);
    });
  };

  const handleSaveDocument = async () => {
    if (!documentEditor || !tableName) {
      return;
    }

    const parsedDocument = parseJSONObject(documentEditor.content, t('mongodb.document'), t);
    if (!parsedDocument) {
      return;
    }

    const payload = JSON.stringify(parsedDocument);

    if (documentEditor.mode === 'create') {
      await insertDocumentMutation.mutateAsync({
        connectionId,
        dbName,
        tableName,
        document: payload,
      });
      showSuccess(t('mongodb.createSuccess'));
    } else {
      if (documentEditor.id === undefined) {
        showError({
          title: 'INVALID_DOCUMENT',
          message: t('mongodb.missingId'),
        });
        return;
      }

      await updateDocumentMutation.mutateAsync({
        connectionId,
        dbName,
        tableName,
        id: documentEditor.id,
        document: payload,
      });
      showSuccess(t('mongodb.updateSuccess'));
    }

    setDocumentEditor(null);
    setSelectedRowKeys([]);
    getCollectionDataQuery.refetch();
  };

  useEffect(() => {
    // Query-specific list expansion keys are invalid after query changes.
    setListExpandedMap({});
  }, [
    queryApplied.filter,
    queryApplied.projection,
    queryApplied.sort,
    queryApplied.limit,
    queryApplied.skip,
  ]);

  useEffect(() => {
    setDocViewMode('list');
    setQueryDraft(DEFAULT_QUERY_STATE);
    setQueryApplied(DEFAULT_QUERY_STATE);
    setSelectedRowKeys([]);
    setDocumentEditor(null);
    setListExpandedMap({});
  }, [dbName, tableName]);

  const setQueryDraftState: Dispatch<SetStateAction<IDocumentQueryState>> = setQueryDraft;

  return {
    documentsPanelProps: {
      queryDraft,
      setQueryDraft: setQueryDraftState,
      onApplyQuery: handleApplyQuery,
      onResetQuery: handleResetQuery,
      onSkipMove: handleSkipMove,
      canGoPrev: queryApplied.skip > 0,
      canGoNext: queryApplied.skip + queryApplied.limit < (getCollectionDataQuery.data?.count || 0),
      current: Math.floor(queryApplied.skip / queryApplied.limit) + 1,
      pageSize: queryApplied.limit,
      onTablePageChange: handleTablePageChange,
      documentRows,
      documentColumns,
      isLoading: getCollectionDataQuery.isLoading,
      selectedRowKeys,
      selectedRows,
      onSelectedRowKeysChange: keys => setSelectedRowKeys(keys),
      onOpenEdit: handleOpenEdit,
      onDeleteByIds: handleDeleteByIds,
      onOpenCreate: handleOpenCreate,
      resultTotal: getCollectionDataQuery.data?.count || 0,
      docViewMode,
      setDocViewMode,
      listExpandedMap,
      onToggleListExpanded: path =>
        setListExpandedMap(prev => ({
          ...prev,
          [path]: !prev[path],
        })),
      onToggleRowSelection: handleToggleRowSelection,
    },
    documentEditorModalProps: {
      documentEditor,
      isSubmitting: insertDocumentMutation.isPending || updateDocumentMutation.isPending,
      onCancel: () => setDocumentEditor(null),
      onSubmit: handleSaveDocument,
      onChangeContent: value =>
        setDocumentEditor(current => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            content: value,
          };
        }),
    },
  };
};

export default useMongoDocumentsModel;
