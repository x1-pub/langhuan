import { Spin } from 'antd';
import { Outlet, useParams } from 'react-router';
import classNames from 'classnames';

import { EConnectionType } from '@packages/types/connection';
import { DatabaseWindowsContext } from '@/domain/workbench/state/database-window-state';
import useWorkbenchModel from '@/domain/workbench/hooks/use-workbench-model';
import {
  ParsedConnectionRouteParams,
  parseConnectionRouteParams,
} from '@/shared/router/connection-route';
import Editor from './components/editor';
import RedisDatabase from './components/redis-database';
import MysqlDatabase from './components/mysql-database';
import Actions from './components/actions';
import MongoDBDatabase from './components/mongodb-database';
import PgsqlDatabase from './components/pgsql-database';
import NotFound from '@/pages/not-found';
import styles from './index.module.less';

const MenuLayoutContent: React.FC<ParsedConnectionRouteParams> = ({
  connectionId,
  connectionType,
}) => {
  const isRedisConnection = connectionType === EConnectionType.REDIS;
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
          <aside className={classNames(styles.menu, isRedisConnection && styles.menuCompact)}>
            <Actions
              connectionId={connectionId}
              connectionType={connectionType}
              onCreateDatabase={handleCreateDatabase}
            />
            {isRedisConnection && (
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

const MenuLayout: React.FC = () => {
  const { connectionId, connectionType } = useParams();
  const resolvedParams = parseConnectionRouteParams(connectionType, connectionId);

  if (!resolvedParams) {
    return <NotFound />;
  }

  return <MenuLayoutContent {...resolvedParams} />;
};

export default MenuLayout;
