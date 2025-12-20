import React, { useState } from 'react';
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
import styles from './index.module.less';

type TTableList = RouterOutput['table']['getList'];

const MenuLayout: React.FC = () => {
  const { connectionId: connectionIdString, connectionType: connectionTypeString } = useParams();
  const connectionId = Number(connectionIdString);
  const connectionType = String(connectionTypeString) as EConnectionType;

  const queryClient = useQueryClient();
  const [active, setActive] = useState<string>('');
  const [wind, setWind] = useState<IWind[]>([]);
  const [tableMap, setTableMap] = useState<Record<string, TTableList>>({});
  const [editorData, setEditorData] = useState<TEditorData>();

  const databaseListQuery = useQuery(
    trpc.database.getList.queryOptions({ type: connectionType, connectionId }),
  );
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
        const omitPreDBWind = wind.filter(w => w.dbName !== variables.dbName);
        setWind(omitPreDBWind);
        const activeId = generateActiveId(omitPreDBWind[0]?.dbName, omitPreDBWind[0]?.tableName);
        setActive(activeId);
        setTableMap(t => omit(t, variables.dbName));
        queryClient.invalidateQueries(databaseListQuery);
      },
    }),
  );
  const deleteTableMutation = useMutation(
    trpc.table.delete.mutationOptions({
      onSuccess(_data, variables) {
        const omitPreTableWind = wind.filter(
          w => !(w.tableName === variables.tableName && w.dbName === variables.dbName),
        );
        setWind(omitPreTableWind);
        const activeId = generateActiveId(
          omitPreTableWind[0]?.dbName,
          omitPreTableWind[0]?.tableName,
        );
        setActive(activeId);
        tableListMutation.mutateAsync(variables);
      },
    }),
  );

  const handleDeleteDatabase = (dbName: string) => {
    deleteDatabaseMutation.mutateAsync({ type: connectionType, connectionId, dbName });
  };

  const handleCreateDatabase = () => {
    setEditorData({
      type: EEditorType.CREATE_DB,
    });
  };

  const handleDeleteTable = (dbName: string, tableName: string) => {
    deleteTableMutation.mutateAsync({ type: connectionType, connectionId, dbName, tableName });
  };

  const handleAfterEditor = () => {
    if (editorData!.type === EEditorType.CREATE_DB) {
      databaseListQuery.refetch();
    }

    if (editorData!.type === EEditorType.CREATE_TABLE) {
      tableListMutation.mutateAsync({
        type: connectionType,
        connectionId,
        dbName: editorData!.dbName,
      });
    }

    if (editorData!.type === EEditorType.EDIT_TABLE) {
      const omitPreTableWind = wind.filter(
        w => !(w.tableName === editorData!.tableName && w.dbName === editorData!.dbName),
      );
      setWind(omitPreTableWind);
      const activeId = generateActiveId(
        omitPreTableWind[0]?.dbName,
        omitPreTableWind[0]?.tableName,
      );
      setActive(activeId);
      tableListMutation.mutateAsync({
        type: connectionType,
        connectionId,
        dbName: editorData!.dbName,
      });
    }

    if (editorData!.type === EEditorType.EDIT_DB) {
      const omitPreDBWind = wind.filter(w => w.dbName !== editorData!.dbName);
      setWind(omitPreDBWind);
      const activeId = generateActiveId(omitPreDBWind[0]?.dbName, omitPreDBWind[0]?.tableName);
      setActive(activeId);
      databaseListQuery.refetch();
    }

    setEditorData(undefined);
  };

  const handleOpenTable = (dbName: string, tableName?: string, specialWind?: ESpecialWind) => {
    const activeId = generateActiveId(dbName, tableName, specialWind);
    const hasOpen = wind.find(
      p => generateActiveId(p.dbName, p.tableName, p.specialWind) === activeId,
    );
    setWind(hasOpen ? wind : [...wind, { dbName, tableName, specialWind }]);
    setActive(activeId);
  };

  const handleOpenDatabase = (keys: string[]) => {
    const dbName = keys[keys.length - 1];
    if (!dbName || tableMap[dbName]) {
      return;
    }
    tableListMutation.mutateAsync({ type: connectionType, connectionId, dbName });
  };

  return (
    <div className={styles.menuWrapper}>
      <DatabaseWindowsContext.Provider
        value={{
          connectionId,
          connectionType,
          wind,
          active,
          setWind,
          setActive,
        }}
      >
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
            {connectionType === EConnectionType.MYSQL && (
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
          </div>
        </Spin>
        <Editor
          type={connectionType}
          connectionId={connectionId}
          data={editorData}
          onCancel={() => setEditorData(undefined)}
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
