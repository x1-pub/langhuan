import { Context, Next } from 'koa';

import { IRsp } from '@/typings/koa-context';
import { RspCode } from '@/utils/error';

export default () => {
  return async (ctx: Context, next: Next) => {
    ctx.r = (op?: Partial<IRsp>) => {
      const body = {
        code: op?.code ?? RspCode.SUCCESS,
        data: op?.data ?? null,
        message: op?.code ? op?.message || 'UNKNOW ERROR' : 'SUCCESS',
      }
      ctx.body = body
    }
    await next();
  }
};

