import React from 'react';

import MongodbIcon from '@/assets/svg/mongodb.svg?react';
import MysqlIcon from '@/assets/svg/mysql.svg?react';
import RedisIcon from '@/assets/svg/redis.svg?react';
import styles from './index.module.less';
import { EConnectionType } from '@packages/types/connection';

const DBIcon: React.FC<{ type: EConnectionType }> = ({ type }) => {
  if (type === EConnectionType.MONGODB) {
    return <MongodbIcon className={styles.dbType} style={{ fill: '#26664B' }} />;
  }

  if (type === EConnectionType.MYSQL) {
    return <MysqlIcon className={styles.dbType} style={{ fill: '#2F738D' }} />;
  }

  if (type === EConnectionType.REDIS) {
    return <RedisIcon className={styles.dbType} style={{ fill: '#EE5842' }} />;
  }
};

export default DBIcon;
