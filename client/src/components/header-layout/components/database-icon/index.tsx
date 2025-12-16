import React from 'react';

import MongodbIcon from '@/assets/svg/mongodb.svg?react';
import MysqlIcon from '@/assets/svg/mysql.svg?react';
import RedisIcon from '@/assets/svg/redis.svg?react';
import { EConnectionType } from '@packages/types/connection';
import styles from './index.module.less';

const DatabaseIcon: React.FC<{ type: EConnectionType }> = ({ type }) => {
  if (type === EConnectionType.MONGODB) {
    return <MongodbIcon className={styles.databaseIcon} style={{ fill: '#26664B' }} />;
  }

  if (type === EConnectionType.MYSQL) {
    return <MysqlIcon className={styles.databaseIcon} style={{ fill: '#2F738D' }} />;
  }

  if (type === EConnectionType.REDIS) {
    return <RedisIcon className={styles.databaseIcon} style={{ fill: '#EE5842' }} />;
  }

  return null;
};

export default DatabaseIcon;
