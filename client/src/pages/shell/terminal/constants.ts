// import { ConnectionType } from "@/api/connection";

// export const LANG_HUAN = `
//   ▗▖    ▗▄▖ ▗▖  ▗▖ ▗▄▄▖▗▖ ▗▖▗▖ ▗▖ ▗▄▖ ▗▖  ▗▖
//   ▐▌   ▐▌ ▐▌▐▛▚▖▐▌▐▌   ▐▌ ▐▌▐▌ ▐▌▐▌ ▐▌▐▛▚▖▐▌
//   ▐▌   ▐▛▀▜▌▐▌ ▝▜▌▐▌▝▜▌▐▛▀▜▌▐▌ ▐▌▐▛▀▜▌▐▌ ▝▜▌
//   ▐▙▄▄▖▐▌ ▐▌▐▌  ▐▌▝▚▄▞▘▐▌ ▐▌▝▚▄▞▘▐▌ ▐▌▐▌  ▐▌

// `

// export const COLORS = {
//   RED: '\x1b[31m',
//   GREEN: '\x1b[32m',
//   RESET: '\x1b[0m',
// };

// export const WELCOME: Record<ConnectionType, string[]> = {
//   mysql: [
//     'Welcome to MySQL Shell',
//     'Type your SQL commands and press Enter to execute',
//     'Commands should end with semicolon (;)',
//   ],
//   redis: [
//     'Welcome to Redis CLI',
//     'Type your Redis commands and press Enter to execute'
//   ],
//   mongodb: [
//     'Welcome to MongoDB Shell',
//     'Type your MongoDB commands and press Enter to execute',
//     '',
//     '⚠️ 由于服务器资源有限，您输入的Shell命令将通过如下流程执行：',
//     '   1. 接收您提供的MongoDB Shell命令字符串',
//     '   2. 解析命令结构和参数',
//     '   3. 将命令转换为对应的Mongoose API调用',
//     '   4. 使用Mongoose安全地执行操作',
//     '   5. 返回执行结果',
//     '',
//     '🔒 所以请您注意：',
//     '   1. 某些MongoDB Shell特有的功能可能不被支持',
//     '   2. 复杂的嵌套命令可能需要简化后使用',
//     '   3. 本服务暂时不支持JavaScript函数执行或eval操作',
//     '   4. 管理命令受限于连接用户的权限',
//   ],
// }

// const SQL_KEYWORDS = [
//   'CREATE', 'DATABASES', 'DROP', 'USE', 'SHOW', 'ALTER', 'COLUMNS',
//   'TABLE', 'DESC', 'DESCRIBE', 'TRUNCATE',
//   'INDEX', 'UNIQUE', 'PRIMARY', 'KEY',
//   'INSERT', 'INTO', 'VALUES', 'SELECT', 'FROM', 'WHERE',
//   'GROUP', 'BY', 'HAVING', 'ORDER', 'LIMIT', 'OFFSET',
//   'UPDATE', 'SET', 'DELETE',
//   'AND', 'OR', 'NOT', '=', '!=', '<>', '>', '<', '>=', '<=',
//   'IN', 'NOT IN', 'BETWEEN', 'LIKE', 'IS', 'NULL',
//   'INNER', 'JOIN', 'LEFT', 'RIGHT', 'FULL', 'ON',
//   'COUNT', 'SUM', 'AVG', 'MAX', 'MIN',
//   'CONCAT', 'SUBSTRING', 'TRIM', 'UPPER', 'LOWER',
//   'NOW', 'CURRENT_TIMESTAMP', 'DATE_FORMAT', 'DATEDIFF',
//   'IF', 'CASE', 'COALESCE',
//   'EXISTS', 'BEGIN', 'COMMIT', 'ROLLBACK',
//   'GRANT', 'REVOKE', 'USER', 'VIEW'
// ]

// const REDIS_KEYWORDS = [
//   'SET', 'GET', 'DEL', 'EXISTS', 'TYPE', 'RENAME', 'EXPIRE', 'TTL', 'PERSIST', 'SELECT',
//   'KEYS', 'SCAN', 'MSET', 'MGET',
//   'SETNX', 'INCR', 'DECR', 'INCRBY', 'DECRBY', 'APPEND', 'STRLEN',
//   'HSET', 'HGET', 'HDEL', 'HMSET', 'HMGET', 'HGETALL', 'HKEYS', 'HVALS', 'HEXISTS', 'HLEN',
//   'LPUSH', 'RPUSH', 'LPOP', 'RPOP', 'LRANGE', 'LLEN', 'LSET',
//   'SADD', 'SREM', 'SMEMBERS', 'SISMEMBER', 'SCARD', 'SINTER', 'SUNION', 'SDIFF',
//   'ZADD', 'ZREM', 'ZRANGE', 'ZREVRANGE', 'ZSCORE', 'ZINCRBY', 'ZCARD', 'ZRANK',
//   'INFO', 'CONFIG', 'GET', 'SET', 'FLUSHDB', 'FLUSHALL',
//   'PUBLISH', 'SUBSCRIBE', 'MULTI', 'EXEC', 'DISCARD', 'SAVE', 'BGSAVE', 'LASTSAVE'
// ]

// const MONGO_KEYWORDS = [
//   'use', 'db', 'dropDatabase', 'show', 'dbs',
//   'createCollection', 'collection', 'drop', 'collections',
//   'insertOne', 'insertMany',
//   'find', 'findOne',
//   'updateOne', 'updateMany', 'replaceOne',
//   'deleteOne', 'deleteMany',
//   '$eq', '$ne', '$gt', '$lt', '$gte', '$lte', '$in', '$nin',
//   '$and', '$or', '$not', '$nor', '$exists', '$type',
//   '$all', '$elemMatch', '$size',
//   'sort', 'skip', 'limit',
//   '$match', '$group', '$sort', '$skip', '$limit', '$project', '$lookup', '$unwind',
//   '$sum', '$avg', '$max', '$min', '$first', '$last',
//   'createIndex', 'dropIndex', 'getIndexes',
//   'countDocuments', 'distinct', 'runCommand'
// ]

// export const KEYWORDS: Record<ConnectionType, string[]> = {
//   mysql: SQL_KEYWORDS,
//   redis: REDIS_KEYWORDS,
//   mongodb: MONGO_KEYWORDS,
// }

// export const TITLE_PREFIX: Record<ConnectionType, string> = {
//   mysql: 'MySQL shell',
//   redis: 'Redis Shell',
//   mongodb: 'MongoDB shell',
// }
