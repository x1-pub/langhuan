import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EConnectionType } from '@packages/types/connection';
import { trpc, type RouterOutput } from '@/infra/api/trpc';
import {
  buildWindowId,
  type DatabaseWindow,
  type DatabaseWindowsContextValue,
  ESpecialWind,
} from '@/domain/workbench/state/database-window-state';
import {
  appendWindowIfMissing,
  removeWindowsByDatabase,
  removeWindowsByTable,
  resolveActiveWindowId,
} from '@/domain/workbench/model/window-operations';
import { EEditorType, type TEditorData } from '@/components/menu-layout/components/editor/types';

type TableList = RouterOutput['table']['getList'];

interface UseWorkbenchModelArgs {
  connectionId: number;
  connectionType: EConnectionType;
}

const removeKeyFromTableMap = (tableMap: Record<string, TableList>, dbName: string) => {
  const { [dbName]: _, ...rest } = tableMap;
  return rest;
};

export const useWorkbenchModel = ({ connectionId, connectionType }: UseWorkbenchModelArgs) => {
  const queryClient = useQueryClient();
  const [activeWindowId, setActiveWindowId] = useState('');
  const [windows, setWindows] = useState<DatabaseWindow[]>([]);
  const [tableMap, setTableMap] = useState<Record<string, TableList>>({});
  const [editorData, setEditorData] = useState<TEditorData>();

  const isMysqlCompatible =
    connectionType === EConnectionType.MYSQL || connectionType === EConnectionType.MARIADB;

  const databaseListQueryOptions = trpc.database.getList.queryOptions({
    type: connectionType,
    connectionId,
  });
  const databaseListQuery = useQuery(databaseListQueryOptions);

  const tableListMutation = useMutation(
    trpc.table.getList.mutationOptions({
      onSuccess(data, variables) {
        setTableMap(previousTableMap => ({
          ...previousTableMap,
          [variables.dbName]: data,
        }));
      },
    }),
  );

  const deleteDatabaseMutation = useMutation(
    trpc.database.delete.mutationOptions({
      onSuccess(_data, variables) {
        setWindows(previousWindows => removeWindowsByDatabase(previousWindows, variables.dbName));
        setTableMap(previousTableMap => removeKeyFromTableMap(previousTableMap, variables.dbName));
        void queryClient.invalidateQueries({ queryKey: databaseListQueryOptions.queryKey });
      },
    }),
  );

  const deleteTableMutation = useMutation(
    trpc.table.delete.mutationOptions({
      onSuccess(_data, variables) {
        setWindows(previousWindows =>
          removeWindowsByTable(previousWindows, variables.dbName, variables.tableName),
        );
        void tableListMutation.mutateAsync({
          type: variables.type,
          connectionId: variables.connectionId,
          dbName: variables.dbName,
        });
      },
    }),
  );

  useEffect(() => {
    setActiveWindowId(previousActiveId => resolveActiveWindowId(windows, previousActiveId));
  }, [windows]);

  const handleDeleteDatabase = (dbName: string) => {
    void deleteDatabaseMutation.mutateAsync({ type: connectionType, connectionId, dbName });
  };

  const handleCreateDatabase = () => {
    setEditorData({ type: EEditorType.CREATE_DB });
  };

  const handleDeleteTable = (dbName: string, tableName: string) => {
    void deleteTableMutation.mutateAsync({
      type: connectionType,
      connectionId,
      dbName,
      tableName,
    });
  };

  const handleEditorSubmit = () => {
    if (!editorData) {
      return;
    }

    switch (editorData.type) {
      case EEditorType.CREATE_DB:
        void queryClient.invalidateQueries({ queryKey: databaseListQueryOptions.queryKey });
        break;
      case EEditorType.CREATE_TABLE:
        void tableListMutation.mutateAsync({
          type: connectionType,
          connectionId,
          dbName: editorData.dbName,
        });
        break;
      case EEditorType.EDIT_TABLE:
        setWindows(previousWindows =>
          removeWindowsByTable(previousWindows, editorData.dbName, editorData.tableName),
        );
        void tableListMutation.mutateAsync({
          type: connectionType,
          connectionId,
          dbName: editorData.dbName,
        });
        break;
      case EEditorType.EDIT_DB:
        setWindows(previousWindows => removeWindowsByDatabase(previousWindows, editorData.dbName));
        void queryClient.invalidateQueries({ queryKey: databaseListQueryOptions.queryKey });
        break;
      default:
        break;
    }

    setEditorData(undefined);
  };

  const handleOpenTable = (dbName: string, tableName?: string, specialWind?: ESpecialWind) => {
    const nextActiveId = buildWindowId({ dbName, tableName, specialWind });
    setWindows(previousWindows => {
      const next = appendWindowIfMissing(previousWindows, { dbName, tableName, specialWind });
      return next.windows;
    });
    setActiveWindowId(nextActiveId);
  };

  const handleOpenDatabase = (keys: string[]) => {
    const dbName = keys[keys.length - 1];
    if (!dbName || tableMap[dbName]) {
      return;
    }

    void tableListMutation.mutateAsync({ type: connectionType, connectionId, dbName });
  };

  const closeEditor = () => {
    setEditorData(undefined);
  };

  const databaseWindowsContextValue: DatabaseWindowsContextValue = {
    connectionId,
    connectionType,
    wind: windows,
    active: activeWindowId,
    setWind: setWindows,
    setActive: setActiveWindowId,
  };

  return {
    databaseWindowsContextValue,
    isMysqlCompatible,
    databaseList: databaseListQuery.data,
    isSidebarLoading: databaseListQuery.isLoading || tableListMutation.isPending,
    tableMap,
    editorData,
    setEditorData,
    activeWindowId,
    handleDeleteDatabase,
    handleCreateDatabase,
    handleDeleteTable,
    handleEditorSubmit,
    handleOpenTable,
    handleOpenDatabase,
    closeEditor,
  };
};

export default useWorkbenchModel;
