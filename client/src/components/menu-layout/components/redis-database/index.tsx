import React from 'react';
import { List } from 'antd';
import classNames from 'classnames';

import DatabaseIcon from '@/assets/svg/db.svg?react';
import { RouterOutput } from '@/infra/api/trpc';
import { generateActiveId } from '@/domain/workbench/state/database-window-state';
import EllipsisText from '@/components/ellipsis-text';
import styles from './index.module.less';

type TTableList = RouterOutput['table']['getList'];

interface IRedisDatabaseProps {
  database?: TTableList;
  activeId?: string;
  className?: string;
  onClick?: (name: string) => void;
}

interface IRedisDatabaseItem {
  name: string;
}

const RedisDatabase: React.FC<IRedisDatabaseProps> = ({
  database,
  activeId,
  className,
  onClick,
}) => {
  return (
    <List<IRedisDatabaseItem>
      split={false}
      dataSource={(database || []) as IRedisDatabaseItem[]}
      className={className}
      renderItem={item => (
        <List.Item>
          <div
            className={classNames(styles.redis, {
              [styles.active]: activeId === generateActiveId({ dbName: item.name }),
            })}
            onClick={() => onClick?.(item.name)}
          >
            <DatabaseIcon className={styles.databaseIcon} />
            <EllipsisText text={item.name} className={styles.redisText} />
          </div>
        </List.Item>
      )}
    />
  );
};

export default RedisDatabase;
