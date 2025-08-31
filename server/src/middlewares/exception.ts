import { Context, Next } from 'koa';
import { DatabaseError } from 'sequelize';

import { CustomError } from '@/utils/error';
import { RspCode } from '@/utils/error';
import { ReplyError } from 'ioredis';

const isDev = process.env.NODE_ENV === 'development';

export default () => {
  return async (ctx: Context, next: Next) => {
    try {
      await next();
    } catch (error: any) {
      if (isDev) {
        console.log(error);
      }

      if (error instanceof CustomError) {
        ctx.r(error)
        return
      }

      if (error instanceof DatabaseError) {
        ctx.r({
          code: RspCode.MYSQL_ERROR,
          message: `${error.message}\n${error.sql}`,
        })
        return
      }

      if (error instanceof ReplyError) {
        ctx.r({
          code: RspCode.REDIS_ERROR,
          message: `${error.message}\n${JSON.stringify(error.command)}`,
        })
        return
      }

      ctx.r({
        code: RspCode.UNKNOW_ERROR,
        message: String(error.message || error.msg || error)
      })
    }
  };
};

