import './utils/alias'
import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import chalk from 'chalk';

import config from './config/index'
import allRouter from './routers';
import ctxApi from './middlewares/ctx-api'
import exception from './middlewares/exception';

const app = new Koa();
const router = new Router()

app.use(ctxApi())
app.use(exception())
app.use(bodyParser())
app.use(allRouter.routes())
app.use(router.allowedMethods())

app.listen(config.koa.port, () => {
  console.log('')
  console.log(
    chalk.green('  ➜  ') +
    'Local:  ' +
    chalk.hex('#8EFAFD').underline(`http://127.0.0.1:${config.koa.port}`)
  )
})