import { Context } from 'koa';
import axios from 'axios';

import { SESSION_ID_NAME } from '@/utils';
import config from '@/config';

class AuthController {
  async ticket(ctx: Context) {
    const { ticket, callbackUrl } = ctx.query
    const { data } = await axios.post(`${config.sso.host}/api/business/auth/ticket`, {
      ticket,
      appId: config.sso.appId,
      appSecret: config.sso.appSecret,
    })
    if (data.code === 0) {
      ctx.cookies.set(SESSION_ID_NAME, data.data.sessionId, {
        maxAge: 1000 * 60 * 60 * 24,
      })
      ctx.redirect(callbackUrl as string)
    }
    ctx.r()
  }
}

export default new AuthController()
