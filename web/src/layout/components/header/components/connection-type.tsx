import React from 'react'

import { ConnectionType } from '@/api/connection'
import MongodbIcon from '@/assets/svg/mongodb.svg?react'
import MysqlIcon from '@/assets/svg/mysql.svg?react'
import RedisIcon from '@/assets/svg/redis.svg?react'
import styles from './index.module.less'

const DBIcon: React.FC<{ type: ConnectionType }> = ({ type }) => {
  if (type === 'mongodb') {
    return <MongodbIcon className={styles.dbType} style={{ fill: '#26664B' }} />
  }

  if (type === 'mysql') {
    return <MysqlIcon className={styles.dbType} style={{ fill: '#2F738D' }} />
  }

  if (type === 'redis') {
    return <RedisIcon className={styles.dbType} style={{ fill: '#EE5842' }} />
  }
}

export default DBIcon