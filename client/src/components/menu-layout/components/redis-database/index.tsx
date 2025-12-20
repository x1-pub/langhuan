import React from 'react';
import { List } from 'antd';
import classNames from 'classnames';

import DatabaseIcon from '@/assets/svg/db.svg?react';
import { RouterOutput } from '@/utils/trpc';
import { generateActiveId } from '@/hooks/use-database-windows';
import styles from './index.module.less';

type TTableList = RouterOutput['table']['getList'];

interface IRedisDatabaseProps {
  database?: TTableList;
  activeId?: string;
  className?: string;
  onClick?: (name: string) => void;
}

const RedisDatabase: React.FC<IRedisDatabaseProps> = ({
  database,
  activeId,
  className,
  onClick,
}) => {
  return (
    <List
      split={false}
      dataSource={database}
      className={className}
      renderItem={item => (
        <List.Item>
          <span
            className={classNames(styles.redis, {
              [styles.active]: activeId === generateActiveId(item.name),
            })}
            onClick={() => onClick?.(item.name)}
          >
            <DatabaseIcon className={styles.databaseIcon} />
            <span title={item.name}>{item.name}</span>
          </span>
        </List.Item>
      )}
    />
  );
};

export default RedisDatabase;
