import { Context, Next } from 'koa';
import path from 'path';
import fs from 'fs'

import config from '@/config';

export default () => {
  return async (ctx: Context, next: Next) => {
    if (ctx.request.url.startsWith(config.koa.globalPrefix)) {
      await next()
    } else {
      const filePath = path.join(__dirname, '../../public/web/index.html');
      const html = fs.readFileSync(filePath, 'utf8');
  
      ctx.type = 'text/html';
      ctx.body = html;
    }
  }
};


