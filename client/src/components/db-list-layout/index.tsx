import React, { useState } from 'react';
import { List, Collapse, Spin, type CollapseProps, Button } from 'antd';
import { Outlet, useParams } from 'react-router';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { omit } from 'lodash';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { EConnectionType } from '@packages/types/connection';
import TableIcon from '@/assets/svg/table.svg?react';
import DBIcon from '@/assets/svg/db.svg?react';
import ShellIcon from '@/assets/svg/shell.svg?react';
import Editor from './components/editor';
import { DatabaseContext, generateActiveId, IWind } from '@/utils/use-main';
import { Confirmation } from '@/components/confirmation-modal';
import EllipsisText from '@/components/ellipsis-text';
import { trpc, RouterOutput } from '@/utils/trpc';
import styles from './index.module.less';
import { EEditorType, TEditorData } from './components/types';

type TTableList = RouterOutput['table']['getList'];

const DBListLayout: React.FC = () => {
  const { connectionId: connectionIdString, connectionType: connectionTypeString } = useParams();
  const connectionId = Number(connectionIdString);
  const connectionType = String(connectionTypeString) as EConnectionType;

  const { t } = useTranslation();
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

  const databaseCollapse: CollapseProps['items'] = databaseListQuery.data?.map(db => ({
    key: db.name,
    label: (
      <span className={styles.dbTitle}>
        <DBIcon style={{ width: '12px', paddingRight: '8px' }} />
        <EllipsisText text={db.name} width={150} />
      </span>
    ),
    children: (
      <List
        size="small"
        split={false}
        dataSource={tableMap?.[db.name] || []}
        renderItem={item => (
          <List.Item className={styles.tableWrap}>
            <span
              className={classNames(styles.tableTitle, {
                [styles.active]: active === generateActiveId(db.name, item.name),
              })}
              onClick={() => handleOpenTable(db.name, item.name)}
            >
              <TableIcon style={{ width: '14px', paddingRight: '8px' }} />
              <EllipsisText text={item.name} width={140} />
            </span>
            <span className={styles.handler}>
              <EditOutlined
                className={styles.icon}
                onClick={() => handleEditTable(db.name, item.name, item.comment)}
              />
              <Confirmation
                matchText={`${db.name}.${item.name}`}
                node={<DeleteOutlined className={styles.icon} />}
                onConfirm={() => handleDeleteTable(db.name, item.name)}
              />
            </span>
          </List.Item>
        )}
      />
    ),
    extra: (
      <div className={styles.handler}>
        <PlusOutlined className={styles.icon} onClick={e => handleCreateTable(e, db.name)} />
        <EditOutlined
          className={styles.icon}
          onClick={e => handleEditDatabase(e, db.name, db.charset, db.collation)}
        />
        <Confirmation
          matchText={db.name}
          node={<DeleteOutlined className={styles.icon} />}
          onConfirm={() => handleDeleteDatabase(db.name)}
        />
      </div>
    ),
    className: styles.collapseItem,
    showArrow: false,
  }));

  const handleCreateTable = (
    event: React.MouseEvent<HTMLSpanElement, MouseEvent>,
    dbName: string,
  ) => {
    event.stopPropagation();
    setEditorData({
      type: EEditorType.CREATE_TABLE,
      dbName,
    });
  };

  const handleEditDatabase = (
    event: React.MouseEvent<HTMLSpanElement, MouseEvent>,
    dbName: string,
    charset?: string,
    collation?: string,
  ) => {
    event.stopPropagation();
    setEditorData({
      type: EEditorType.EDIT_DB,
      dbName,
      comment: '',
      charset,
      collation,
    });
  };

  const handleDeleteDatabase = (dbName: string) => {
    deleteDatabaseMutation.mutateAsync({ type: connectionType, connectionId, dbName });
  };

  const handleCreateDatabase = () => {
    setEditorData({
      type: EEditorType.CREATE_DB,
    });
  };

  const handleOpenShell = () => {
    window.open(`/${connectionType}/${connectionId}/shell`, '_blank');
  };

  const handleEditTable = (dbName: string, tableName: string, comment?: string) => {
    setEditorData({
      type: EEditorType.EDIT_TABLE,
      dbName,
      tableName,
      comment,
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

  const handleOpenTable = (dbName: string, tableName?: string) => {
    const hasOpen = wind.find(p => p.dbName === dbName && p.tableName == tableName);
    setWind(hasOpen ? wind : [{ dbName, tableName }, ...wind]);
    const activeId = generateActiveId(dbName, tableName);
    setActive(activeId);
  };

  const handleOpenDB = (keys: string[]) => {
    const dbName = keys[keys.length - 1];
    if (!dbName || tableMap[dbName]) {
      return;
    }
    tableListMutation.mutateAsync({ type: connectionType, connectionId, dbName });
  };

  return (
    <div className={styles.wrap}>
      <DatabaseContext.Provider
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
            <div className={styles.buttonGroup}>
              {connectionType !== EConnectionType.REDIS && (
                <Button
                  type="dashed"
                  shape="round"
                  icon={<PlusOutlined />}
                  onClick={handleCreateDatabase}
                >
                  {t('mysql.createDb')}
                </Button>
              )}
              <Button
                className={styles.shellBtn}
                block={connectionType === EConnectionType.REDIS}
                type="dashed"
                shape="round"
                icon={<ShellIcon className={styles.shell} />}
                onClick={handleOpenShell}
              >
                Shell
              </Button>
            </div>
            {connectionType === EConnectionType.REDIS ? (
              <List
                split={false}
                dataSource={databaseListQuery.data}
                className={styles.list}
                renderItem={item => (
                  <List.Item>
                    <span
                      className={classNames(styles.redisTitle, {
                        [styles.active]: active === generateActiveId(item.name, undefined),
                      })}
                      onClick={() => handleOpenTable(item.name, undefined)}
                    >
                      <DBIcon style={{ width: '12px', paddingRight: '8px' }} />
                      <span title={item.name}>{item.name}</span>
                    </span>
                  </List.Item>
                )}
              />
            ) : (
              <Collapse
                ghost={true}
                onChange={handleOpenDB}
                expandIconPosition="start"
                items={databaseCollapse}
                className={styles.list}
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
      </DatabaseContext.Provider>
    </div>
  );
};

export default DBListLayout;
