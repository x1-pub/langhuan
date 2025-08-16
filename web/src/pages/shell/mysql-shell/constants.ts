import { ConnectionType } from "@/api/connection";

export const LANG_HUAN = `
  ▗▖    ▗▄▖ ▗▖  ▗▖ ▗▄▄▖▗▖ ▗▖▗▖ ▗▖ ▗▄▖ ▗▖  ▗▖
  ▐▌   ▐▌ ▐▌▐▛▚▖▐▌▐▌   ▐▌ ▐▌▐▌ ▐▌▐▌ ▐▌▐▛▚▖▐▌
  ▐▌   ▐▛▀▜▌▐▌ ▝▜▌▐▌▝▜▌▐▛▀▜▌▐▌ ▐▌▐▛▀▜▌▐▌ ▝▜▌
  ▐▙▄▄▖▐▌ ▐▌▐▌  ▐▌▝▚▄▞▘▐▌ ▐▌▝▚▄▞▘▐▌ ▐▌▐▌  ▐▌

`

export const COLORS = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  RESET: '\x1b[0m',
};

export const WELCOME: Record<ConnectionType, string[]> = {
  mysql: [
    'Welcome to MySQL Shell',
    'Type your SQL commands and press Enter to execute',
    'Commands should end with semicolon (;)',
  ],
  redis: [
    'Welcome to Redis CLI',
    'Type your Redis commands and press Enter to execute'
  ],
  mongodb: [
    'Welcome to MongoDB Shell',
    'Type your MongoDB commands and press Enter to execute'
  ],
}

const SQL_KEYWORDS = [
  'CREATE', 'DATABASES', 'DROP', 'USE', 'SHOW', 'ALTER', 'COLUMNS',
  'TABLE', 'DESC', 'DESCRIBE', 'TRUNCATE',
  'INDEX', 'UNIQUE', 'PRIMARY', 'KEY',
  'INSERT', 'INTO', 'VALUES', 'SELECT', 'FROM', 'WHERE',
  'GROUP', 'BY', 'HAVING', 'ORDER', 'LIMIT', 'OFFSET',
  'UPDATE', 'SET', 'DELETE',
  'AND', 'OR', 'NOT', '=', '!=', '<>', '>', '<', '>=', '<=',
  'IN', 'NOT IN', 'BETWEEN', 'LIKE', 'IS', 'NULL',
  'INNER', 'JOIN', 'LEFT', 'RIGHT', 'FULL', 'ON',
  'COUNT', 'SUM', 'AVG', 'MAX', 'MIN',
  'CONCAT', 'SUBSTRING', 'TRIM', 'UPPER', 'LOWER',
  'NOW', 'CURRENT_TIMESTAMP', 'DATE_FORMAT', 'DATEDIFF',
  'IF', 'CASE', 'COALESCE',
  'EXISTS', 'BEGIN', 'COMMIT', 'ROLLBACK',
  'GRANT', 'REVOKE', 'USER', 'VIEW'
]

const REDIS_KEYWORDS = [
  'SET', 'GET', 'DEL', 'EXISTS', 'TYPE', 'RENAME', 'EXPIRE', 'TTL', 'PERSIST',
  'KEYS', 'SCAN', 'MSET', 'MGET',
  'SETNX', 'INCR', 'DECR', 'INCRBY', 'DECRBY', 'APPEND', 'STRLEN',
  'HSET', 'HGET', 'HDEL', 'HMSET', 'HMGET', 'HGETALL', 'HKEYS', 'HVALS', 'HEXISTS', 'HLEN',
  'LPUSH', 'RPUSH', 'LPOP', 'RPOP', 'LRANGE', 'LLEN', 'LSET',
  'SADD', 'SREM', 'SMEMBERS', 'SISMEMBER', 'SCARD', 'SINTER', 'SUNION', 'SDIFF',
  'ZADD', 'ZREM', 'ZRANGE', 'ZREVRANGE', 'ZSCORE', 'ZINCRBY', 'ZCARD', 'ZRANK',
  'INFO', 'CONFIG', 'GET', 'SET', 'FLUSHDB', 'FLUSHALL',
  'PUBLISH', 'SUBSCRIBE', 'MULTI', 'EXEC', 'DISCARD', 'SAVE', 'BGSAVE', 'LASTSAVE'
]

const MONGO_KEYWORDS = [
  'use', 'db', 'dropDatabase', 'show', 'dbs',
  'createCollection', 'collection', 'drop', 'collections',
  'insertOne', 'insertMany',
  'find', 'findOne',
  'updateOne', 'updateMany', 'replaceOne',
  'deleteOne', 'deleteMany',
  '$eq', '$ne', '$gt', '$lt', '$gte', '$lte', '$in', '$nin',
  '$and', '$or', '$not', '$nor', '$exists', '$type',
  '$all', '$elemMatch', '$size',
  'sort', 'skip', 'limit',
  '$match', '$group', '$sort', '$skip', '$limit', '$project', '$lookup', '$unwind',
  '$sum', '$avg', '$max', '$min', '$first', '$last',
  'createIndex', 'dropIndex', 'getIndexes',
  'countDocuments', 'distinct', 'runCommand'
]

export const KEYWORDS: Record<ConnectionType, string[]> = {
  mysql: SQL_KEYWORDS,
  redis: REDIS_KEYWORDS,
  mongodb: MONGO_KEYWORDS,
}

export const TITLE_PREFIX: Record<ConnectionType, string> = {
  mysql: 'MySQL shell',
  redis: 'Redis Shell',
  mongodb: 'MongoDB shell',
}

// export const PROMPT_MAP: Record<ConnectionType, string> = {
//   mysql: 'mysql> ',
//   redis: 'redis> ',
//   mongodb: 'mongo> ',
// }
