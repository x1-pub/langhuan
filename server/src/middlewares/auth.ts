import { Context, Next } from 'koa';
import axios from 'axios'

import { SESSION_ID_NAME } from '@/utils';
import config from '@/config';

export default () => {
  return async (ctx: Context, next: Next) => {
    console.log(`[${process.pid}] [${ctx.method}] ${ctx.url}`)
    const sessionId = ctx.cookies.get(SESSION_ID_NAME)
    const callbackUrl = ctx.request.header.referer

    if (!ctx.request.url.startsWith('/api/auth/ticket?') && ctx.request.url.startsWith('/api/')) {
      const { data } = await axios.post(`${config.sso.host}/api/business/auth/session`, {
        sessionId,
        appId: config.sso.appId,
        appSecret: config.sso.appSecret,
        callbackUrl,
      })
      if (data.code !== 0) {
        ctx.r({
          code: data.code,
          data: data.data,
          message: data.message,
        })
        return
      }
      ctx.user = data.data
    }

    await next();
  }
};


