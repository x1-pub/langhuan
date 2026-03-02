import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { showSuccess } from '@/shared/ui/notifications';
import { trpc } from '@/infra/api/trpc';
import { IIndexEditorState, TActiveTab, TMongoIndex } from '../../shared';
import { parseJSONObject } from '../utils';

interface UseMongoIndexesModelParams {
  connectionId: number;
  dbName: string;
  tableName?: string;
  validTableName: boolean;
  activeTab: TActiveTab;
}

export interface IndexesPanelModelProps {
  collectionIndexes: TMongoIndex[];
  isLoading: boolean;
  isDeleting: boolean;
  onRefresh: () => void;
  onOpenCreate: () => void;
  onDeleteIndex: (indexName: string) => void;
}

export interface IndexEditorModalModelProps {
  open: boolean;
  indexEditor: IIndexEditorState;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  onChange: React.Dispatch<React.SetStateAction<IIndexEditorState>>;
}

interface UseMongoIndexesModelResult {
  indexesPanelProps: IndexesPanelModelProps;
  indexEditorModalProps: IndexEditorModalModelProps;
}

const useMongoIndexesModel = ({
  connectionId,
  dbName,
  tableName,
  validTableName,
  activeTab,
}: UseMongoIndexesModelParams): UseMongoIndexesModelResult => {
  const { t } = useTranslation();
  const [indexEditorOpen, setIndexEditorOpen] = useState(false);
  const [indexEditor, setIndexEditor] = useState<IIndexEditorState>({
    keys: '{\n  "field": 1\n}',
    options: '{\n  "unique": false\n}',
  });

  const getCollectionIndexesQuery = useQuery(
    trpc.mongodb.getCollectionIndexes.queryOptions(
      {
        connectionId,
        dbName,
        tableName: tableName || '',
      },
      {
        enabled: !!connectionId && !!dbName && validTableName && activeTab === 'indexes',
      },
    ),
  );

  const createCollectionIndexMutation = useMutation(
    trpc.mongodb.createCollectionIndex.mutationOptions(),
  );
  const deleteCollectionIndexMutation = useMutation(
    trpc.mongodb.deleteCollectionIndex.mutationOptions(),
  );

  const handleCreateIndex = async () => {
    if (!tableName) {
      return;
    }

    const parsedKeys = parseJSONObject(indexEditor.keys, t('mongodb.indexKeys'), t);
    if (!parsedKeys) {
      return;
    }

    const parsedOptions = parseJSONObject(indexEditor.options, t('mongodb.indexOptions'), t);
    if (!parsedOptions) {
      return;
    }

    await createCollectionIndexMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      keys: JSON.stringify(parsedKeys),
      options: JSON.stringify(parsedOptions),
    });

    showSuccess(t('mongodb.indexCreateSuccess'));
    setIndexEditorOpen(false);
    getCollectionIndexesQuery.refetch();
  };

  const handleDeleteIndex = async (indexName: string) => {
    if (!tableName) {
      return;
    }

    await deleteCollectionIndexMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      indexName,
    });

    showSuccess(t('mongodb.indexDeleteSuccess'));
    getCollectionIndexesQuery.refetch();
  };

  useEffect(() => {
    setIndexEditorOpen(false);
    setIndexEditor({
      keys: '{\n  "field": 1\n}',
      options: '{\n  "unique": false\n}',
    });
  }, [dbName, tableName]);

  return {
    indexesPanelProps: {
      collectionIndexes: (getCollectionIndexesQuery.data || []) as TMongoIndex[],
      isLoading: getCollectionIndexesQuery.isLoading,
      isDeleting: deleteCollectionIndexMutation.isPending,
      onRefresh: () => getCollectionIndexesQuery.refetch(),
      onOpenCreate: () => setIndexEditorOpen(true),
      onDeleteIndex: handleDeleteIndex,
    },
    indexEditorModalProps: {
      open: indexEditorOpen,
      indexEditor,
      isSubmitting: createCollectionIndexMutation.isPending,
      onCancel: () => setIndexEditorOpen(false),
      onSubmit: handleCreateIndex,
      onChange: setIndexEditor,
    },
  };
};

export default useMongoIndexesModel;
