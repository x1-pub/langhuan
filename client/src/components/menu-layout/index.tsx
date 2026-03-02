import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Spin } from 'antd';
import { Outlet, useParams } from 'react-router';
import { omit } from 'lodash';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { EConnectionType } from '@packages/types/connection';
import Editor from './components/editor';
import {
  DatabaseWindowsContext,
  ESpecialWind,
  generateActiveId,
  IWind,
} from '@/hooks/use-database-windows';
import { trpc, RouterOutput } from '@/utils/trpc';
import { EEditorType, TEditorData } from './components/editor/types';
import RedisDatabase from './components/redis-database';
import MysqlDatabase from './components/mysql-database';
import Actions from './components/actions';
import MongoDBDatabase from './components/mongodb-database';
import PgsqlDatabase from './components/pgsql-database';
import styles from './index.module.less';

type TTableList = RouterOutput['table']['getList'];
const getFirstActiveId = (windows: IWind[]) =>
  windows.length > 0 ? generateActiveId(windows[0]) : '';

const removeDatabaseWindows = (windows: IWind[], dbName: string) =>
  windows.filter(window => window.dbName !== dbName);

const removeTableWindows = (windows: IWind[], dbName: string, tableName: string) =>
  windows.filter(window => !(window.tableName === tableName && window.dbName === dbName));

const resolveActiveId = (windows: IWind[], currentActiveId: string) => {
  if (!currentActiveId) {
    return getFirstActiveId(windows);
  }

  const hasCurrentActiveWindow = windows.some(
    window => generateActiveId(window) === currentActiveId,
  );
  return hasCurrentActiveWindow ? currentActiveId : getFirstActiveId(windows);
};

const MenuLayout: React.FC = () => {
  const { connectionId: connectionIdString, connectionType: connectionTypeString } = useParams();
  const connectionId = Number(connectionIdString);
  const connectionType = String(connectionTypeString) as EConnectionType;

  const queryClient = useQueryClient();
  const [active, setActive] = useState<string>('');
  const [windows, setWindows] = useState<IWind[]>([]);
  const [tableMap, setTableMap] = useState<Record<string, TTableList>>({});
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
        setTableMap(t => ({
          ...t,
          [variables.dbName]: data,
        }));
      },
    }),
  );
  const deleteDatabaseMutation = useMutation(
    trpc.database.delete.mutationOptions({
      onSuccess(_data, variables) {
        setWindows(previousWindows => removeDatabaseWindows(previousWindows, variables.dbName));
        setTableMap(t => omit(t, variables.dbName));
        void queryClient.invalidateQueries({ queryKey: databaseListQueryOptions.queryKey });
      },
    }),
  );
  const deleteTableMutation = useMutation(
    trpc.table.delete.mutationOptions({
      onSuccess(_data, variables) {
        setWindows(previousWindows =>
          removeTableWindows(previousWindows, variables.dbName, variables.tableName),
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
    setActive(previousActiveId => resolveActiveId(windows, previousActiveId));
  }, [windows]);

  const handleDeleteDatabase = useCallback(
    (dbName: string) => {
      void deleteDatabaseMutation.mutateAsync({ type: connectionType, connectionId, dbName });
    },
    [connectionId, connectionType, deleteDatabaseMutation],
  );

  const handleCreateDatabase = useCallback(() => {
    setEditorData({ type: EEditorType.CREATE_DB });
  }, []);

  const handleDeleteTable = useCallback(
    (dbName: string, tableName: string) => {
      void deleteTableMutation.mutateAsync({
        type: connectionType,
        connectionId,
        dbName,
        tableName,
      });
    },
    [connectionId, connectionType, deleteTableMutation],
  );

  const handleAfterEditor = useCallback(() => {
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
          removeTableWindows(previousWindows, editorData.dbName, editorData.tableName),
        );
        void tableListMutation.mutateAsync({
          type: connectionType,
          connectionId,
          dbName: editorData.dbName,
        });
        break;
      case EEditorType.EDIT_DB:
        setWindows(previousWindows => removeDatabaseWindows(previousWindows, editorData.dbName));
        void queryClient.invalidateQueries({ queryKey: databaseListQueryOptions.queryKey });
        break;
      default:
        break;
    }

    setEditorData(undefined);
  }, [
    connectionId,
    connectionType,
    databaseListQueryOptions.queryKey,
    editorData,
    queryClient,
    tableListMutation,
  ]);

  const handleOpenTable = useCallback(
    (dbName: string, tableName?: string, specialWind?: ESpecialWind) => {
      const activeId = generateActiveId({ dbName, tableName, specialWind });
      setWindows(previousWindows => {
        const hasOpenedWindow = previousWindows.some(
          window => generateActiveId(window) === activeId,
        );
        if (hasOpenedWindow) {
          return previousWindows;
        }
        return [...previousWindows, { dbName, tableName, specialWind }];
      });
      setActive(activeId);
    },
    [],
  );

  const handleOpenDatabase = useCallback(
    (keys: string[]) => {
      const dbName = keys[keys.length - 1];
      if (!dbName || tableMap[dbName]) {
        return;
      }
      void tableListMutation.mutateAsync({ type: connectionType, connectionId, dbName });
    },
    [connectionId, connectionType, tableListMutation, tableMap],
  );

  const contextValue = useMemo(
    () => ({
      connectionId,
      connectionType,
      wind: windows,
      active,
      setWind: setWindows,
      setActive,
    }),
    [active, connectionId, connectionType, windows],
  );

  return (
    <div className={styles.menuWrapper}>
      <DatabaseWindowsContext.Provider value={contextValue}>
        <Spin
          style={{ height: '100%' }}
          spinning={databaseListQuery.isLoading || tableListMutation.isPending}
        >
          <div className={styles.menu}>
            <Actions
              connectionId={connectionId}
              connectionType={connectionType}
              onCreateDatabase={handleCreateDatabase}
            />
            {connectionType === EConnectionType.REDIS && (
              <RedisDatabase
                database={databaseListQuery.data}
                activeId={active}
                className={styles.database}
                onClick={handleOpenTable}
              />
            )}
            {isMysqlCompatible && (
              <MysqlDatabase
                database={databaseListQuery.data}
                tableMap={tableMap}
                activeId={active}
                className={styles.database}
                onClickDatabase={handleOpenDatabase}
                onClickTable={handleOpenTable}
                onDeleteTable={handleDeleteTable}
                onDeleteDatabase={handleDeleteDatabase}
                onEditorData={setEditorData}
              />
            )}
            {connectionType === EConnectionType.MONGODB && (
              <MongoDBDatabase
                database={databaseListQuery.data}
                tableMap={tableMap}
                activeId={active}
                className={styles.database}
                onClickDatabase={handleOpenDatabase}
                onClickTable={handleOpenTable}
                onDeleteTable={handleDeleteTable}
                onDeleteDatabase={handleDeleteDatabase}
                onEditorData={setEditorData}
              />
            )}
            {connectionType === EConnectionType.PGSQL && (
              <PgsqlDatabase
                database={databaseListQuery.data}
                tableMap={tableMap}
                activeId={active}
                className={styles.database}
                onClickDatabase={handleOpenDatabase}
                onClickTable={handleOpenTable}
                onDeleteTable={handleDeleteTable}
                onDeleteDatabase={handleDeleteDatabase}
                onEditorData={setEditorData}
              />
            )}
          </div>
        </Spin>
        <Editor
          type={connectionType}
          connectionId={connectionId}
          data={editorData}
          onCancel={() => {
            setEditorData(undefined);
          }}
          onOk={handleAfterEditor}
        />
        <main className={styles.main}>
          <Outlet />
        </main>
      </DatabaseWindowsContext.Provider>
    </div>
  );
};

export default MenuLayout;
