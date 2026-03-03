import { Spin } from 'antd';
import { Outlet, useParams } from 'react-router';

import { EConnectionType } from '@packages/types/connection';
import { DatabaseWindowsContext } from '@/domain/workbench/state/database-window-state';
import useWorkbenchModel from '@/domain/workbench/hooks/use-workbench-model';
import Editor from './components/editor';
import RedisDatabase from './components/redis-database';
import MysqlDatabase from './components/mysql-database';
import Actions from './components/actions';
import MongoDBDatabase from './components/mongodb-database';
import PgsqlDatabase from './components/pgsql-database';
import styles from './index.module.less';

const resolveConnectionType = (value: string | undefined) => {
  if (!value) {
    return EConnectionType.MYSQL;
  }

  const isKnownType = Object.values(EConnectionType).includes(value as EConnectionType);
  return isKnownType ? (value as EConnectionType) : EConnectionType.MYSQL;
};

const MenuLayout: React.FC = () => {
  const { connectionId: connectionIdString, connectionType: connectionTypeString } = useParams();
  const connectionId = Number(connectionIdString) || 0;
  const connectionType = resolveConnectionType(connectionTypeString);

  const {
    databaseWindowsContextValue,
    isMysqlCompatible,
    databaseList,
    isSidebarLoading,
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
  } = useWorkbenchModel({ connectionId, connectionType });

  return (
    <div className={styles.menuWrapper}>
      <DatabaseWindowsContext.Provider value={databaseWindowsContextValue}>
        <Spin style={{ height: '100%' }} spinning={isSidebarLoading}>
          <aside className={styles.menu}>
            <Actions
              connectionId={connectionId}
              connectionType={connectionType}
              onCreateDatabase={handleCreateDatabase}
            />
            {connectionType === EConnectionType.REDIS && (
              <RedisDatabase
                database={databaseList}
                activeId={activeWindowId}
                className={styles.database}
                onClick={handleOpenTable}
              />
            )}
            {isMysqlCompatible && (
              <MysqlDatabase
                database={databaseList}
                tableMap={tableMap}
                activeId={activeWindowId}
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
                database={databaseList}
                tableMap={tableMap}
                activeId={activeWindowId}
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
                database={databaseList}
                tableMap={tableMap}
                activeId={activeWindowId}
                className={styles.database}
                onClickDatabase={handleOpenDatabase}
                onClickTable={handleOpenTable}
                onDeleteTable={handleDeleteTable}
                onDeleteDatabase={handleDeleteDatabase}
                onEditorData={setEditorData}
              />
            )}
          </aside>
        </Spin>
        <Editor
          type={connectionType}
          connectionId={connectionId}
          data={editorData}
          onCancel={closeEditor}
          onOk={handleEditorSubmit}
        />
        <main className={styles.main}>
          <Outlet />
        </main>
      </DatabaseWindowsContext.Provider>
    </div>
  );
};

export default MenuLayout;
