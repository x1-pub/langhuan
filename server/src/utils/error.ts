export enum RspCode {
  // 请求成功
  SUCCESS = 0,

  // 参数错误
  PARAMETER_ERROR = 10001,

  // 请求资源不存在
  RESOURCE_NOT_FOUND = 10002,

  // 数据库连接失败
  CONNECTION_FAILED = 10003,

  // 数据库连接失败
  DATABASE_SQL_ERROR = 10004,

  // 未知错误
  UNKNOW_ERROR = 11001,
}

export abstract class CustomError extends Error {
  code: number
  constructor(code: RspCode, message: string) {
    super(message);
    this.code = code;
  }
}

// 接口参数校验不通过
export class ParameterError extends CustomError {
  constructor(message: string) {
    super(RspCode.PARAMETER_ERROR, message)
  }
}

// 访问的数据库资源不存在
export class ResourceNotFound extends CustomError {
  constructor(message: string) {
    super(RspCode.RESOURCE_NOT_FOUND, message)
  }
}

// 数据库连接失败
export class ConnectionFailed extends CustomError {
  constructor(message: string) {
    super(RspCode.CONNECTION_FAILED, message)
  }
}
