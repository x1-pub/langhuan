import { Dialect } from 'sequelize'
import { test, prod } from '../../doraemon.json'

const isProd = process.env.NODE_ENV === 'production'

export default {
  koa: {
    port: 7202,
    globalPrefix: '/api',
  },
  mysql: {
    ...(isProd ? prod.mysql : test.mysql),
    option: {
      ...(isProd ? prod.mysql : test.mysql),
      encrypt: false,
      define: { charset: 'utf8' },
      timezone: '+08:00',
      logging: false,
      dialect: 'mysql' as Dialect,
    }
  },
  sso: {
    host: 'https://sso.x1.pub',
    ...(isProd ? prod.sso : test.sso),
  }
}