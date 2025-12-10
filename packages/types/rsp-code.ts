// export enum RspCode {
//   /**
//    * 通用（0 ~ 9999）
//    *
//    * 0   请求成功
//    * 1   未知错误
//    * 401 未登录/Token失效
//    * 403 没有权限
//    * 404 资源不存在
//    * 500 服务器内部错误
//    * 503 服务不可用
//    */
//   SUCCESS = 0,
//   FAIL = 1,
//   UNAUTHORIZED = 401,
//   FORBIDDEN = 403,
//   NOT_FOUND = 404,
//   SERVER_ERROR = 500,
//   SERVICE_UNAVAILABLE = 503,

//   /**
//    * 参数 / 校验错误 (10000 ~ 10999)
//    *
//    * 10001 参数格式错误
//    * 10002 缺少必要参数
//    * 10003 业务校验失败
//    */
//   PARAMETER_ERROR = 10001,
//   MISSING_REQUIRED_PARAM = 10002,
//   VALIDATION_FAILED = 10003,

//   /**
//    * 用户相关 (11000 ~ 11999)
//    *
//    * 11001 用户不存在
//    * 11002 用户已经存在
//    * 11003 密码错误
//    * 11004 账户被锁定
//    */
//   USER_NOT_FOUND = 11001,
//   USER_EXISTS = 11002,
//   PASSWORD_INCORRECT = 11003,
//   ACCOUNT_LOCKED = 11004,

//   /**
//    * 用户Mysql数据库连接相关（12000 ~ 12999）
//    *
//    * 12001 Mysql连接失败
//    */
//   MYSQL_CONNECTION_FAILED = 12001,

//   /**
//    * 用户Redis数据库连接相关（13000 ~ 13999）
//    *
//    * 13001 Redis连接失败
//    */
//   REDIS_CONNECTION_FAILED = 13001,

//   /**
//    * 用户MongoDB数据库连接相关（14000 ~ 14999）
//    *
//    * 14001 MongoDB连接失败
//    */
//   MONGODB_CONNECTION_FAILED = 14001,
// }
