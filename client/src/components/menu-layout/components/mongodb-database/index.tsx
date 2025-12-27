import React from 'react';
import { Collapse } from 'antd';
import classNames from 'classnames';

import DatabaseIcon from '@/assets/svg/db.svg?react';
import TableIcon from '@/assets/svg/table.svg?react';
import { RouterOutput } from '@/utils/trpc';
import { generateActiveId } from '@/hooks/use-database-windows';
import EllipsisText from '@/components/ellipsis-text';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import DestructiveActionConfirm from '@/components/destructive-action-confirm';
import { EEditorType, TEditorData } from '../editor/types';
import styles from './index.module.less';

type TTableList = RouterOutput['table']['getList'];

interface IMongoDBDatabaseProps {
  database?: TTableList;
  tableMap?: Record<string, TTableList>;
  activeId?: string;
  className?: string;
  onClickDatabase?: (names: string[]) => void;
  onClickTable?: (databaseName: string, tableName: string) => void;
  onDeleteDatabase?: (databaseName: string) => void;
  onDeleteTable?: (databaseName: string, tableName: string) => void;
  onEditorData?: (data: TEditorData) => void;
}

const MongoDBDatabase: React.FC<IMongoDBDatabaseProps> = props => {
  const {
    database,
    tableMap,
    activeId,
    className,
    onDeleteDatabase,
    onClickTable,
    onDeleteTable,
    onClickDatabase,
    onEditorData,
  } = props;

  const handleCreateTable = (
    event: React.MouseEvent<HTMLSpanElement, MouseEvent>,
    dbName: string,
  ) => {
    event.stopPropagation();
    onEditorData?.({
      type: EEditorType.CREATE_TABLE,
      dbName,
    });
  };

  const handleEditTable = (dbName: string, tableName: string, comment?: string) => {
    onEditorData?.({
      type: EEditorType.EDIT_TABLE,
      dbName,
      tableName,
      comment,
    });
  };

  return (
    <Collapse
      ghost={true}
      onChange={onClickDatabase}
      expandIconPlacement="start"
      items={database?.map(db => ({
        key: db.name,
        label: (
          <span className={styles.dbTitle}>
            <DatabaseIcon className={styles.databaseIcon} />
            <EllipsisText text={db.name} width={150} />
          </span>
        ),
        children: (
          <>
            {(tableMap?.[db.name] || []).map(table => (
              <li key={table.name} className={styles.tableWrap}>
                <span
                  className={classNames(styles.tableTitle, {
                    [styles.active]:
                      activeId === generateActiveId({ dbName: db.name, tableName: table.name }),
                  })}
                  onClick={() => onClickTable?.(db.name, table.name)}
                >
                  <TableIcon className={styles.tableIcon} />
                  <EllipsisText text={table.name} width={140} />
                </span>
                <span className={styles.handler}>
                  <EditOutlined
                    className={styles.icon}
                    onClick={() => handleEditTable(db.name, table.name, table.comment)}
                  />
                  <DestructiveActionConfirm
                    matchText={`${db.name}.${table.name}`}
                    node={<DeleteOutlined className={styles.icon} />}
                    onConfirm={() => onDeleteTable?.(db.name, table.name)}
                  />
                </span>
              </li>
            ))}
          </>
        ),
        extra: (
          <div className={styles.handler}>
            <PlusOutlined className={styles.icon} onClick={e => handleCreateTable(e, db.name)} />
            <DestructiveActionConfirm
              matchText={db.name}
              node={<DeleteOutlined className={styles.icon} />}
              onConfirm={() => onDeleteDatabase?.(db.name)}
            />
          </div>
        ),
        className: styles.collapseItem,
        showArrow: false,
      }))}
      className={className}
    />
  );
};

export default MongoDBDatabase;
