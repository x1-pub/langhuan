import { Context } from 'koa';

import Connection, { ConnectionType } from '@/model/connection';
import { ConnectionCreateDTO, ConnectionDetailsDTO, ModifyConnectionDTO, DeleteConnectionDTO, TestConnectionDTO } from '@/dto/connection'
import redis from '@/pools/redis';
import mysql from '@/pools/mysql'
import mongoodb from '@/pools/mongodb';

class ConnectionController {
  /**
   * 创建一个连接
   */
  create = async (ctx: Context) => {
    const { type, name, host, port, username, password, database } = await new ConnectionCreateDTO().v(ctx)
    await Connection.create({ type, name, host, port, username, password, database , creator: ctx.user.id })
    ctx.r()
  }

  /**
   * 获取连接列表
   */
  list = async (ctx: Context) => {
    const list = await Connection.findAll({
      where: {
        creator: ctx.user.id,
      },
      attributes: [
        ['id', 'connectionId'],
        ['type', 'connectionType'],
        ['name', 'connectionName'],
      ]
    })
    ctx.r({ data: list })
  }

  /**
   * 获取连接详情
   */
  details = async (ctx: Context) => {
    const { connectionId } = await new ConnectionDetailsDTO().v(ctx)
    const data = await Connection.findOne({
      where: {
        id: connectionId,
        creator: ctx.user.id,
      },
      // attributes: ['id', 'type', 'name', 'host', 'port', 'username', 'username', 'password', 'database']
    })
    if (data?.password) {
      data.password = '*'.repeat(10)
    }
    ctx.r({ data })
  }

  /**
   * 修改连接
   */
  modify = async (ctx: Context) => {
    const { id, type, name, host, port, username, database } = await new ModifyConnectionDTO().v(ctx)
    await Connection.update(
      { type, name, host, port, username, database },
      {
        where: {
          id,
          creator: ctx.user.id,
        }
      }
    )
    ctx.r()
  }

  /**
   * 删除连接
   */
  delete = async (ctx: Context) => {
    const { id } = await new DeleteConnectionDTO().v(ctx)
    const res = await Connection.destroy({
      where: {
        id,
        creator: ctx.user.id,
      }
    })
    
    if (res === 0) {
      throw new Error(`connectionId = ${id} not exist`)
    }

    ctx.r()
  }

  /**
   * 测试连接是否可用
   */
  test = async (ctx: Context) => {
    const { id, type, host, port, username, password, database } = await new TestConnectionDTO().v(ctx)
    const dbConfig = { host, port, username, password, uid: ctx.user.id }

    if (id) {
      const connection = await Connection.findOne({
        where: { creator: ctx.user.id, id }
      })
      if (!connection) {
        throw new Error(`connectionId = ${id} not exist`)
      }
      dbConfig.password = connection.password
    }

    if (type === ConnectionType.MYSQL) {
      await mysql.getInstance(dbConfig)
    }

    if (type === ConnectionType.REDIS) {
      await await redis.getInstance(dbConfig)
    }

    if (type === ConnectionType.MONGODB) {
      await mongoodb.getInstance({ ...dbConfig, database })
    }

    ctx.r()
  }
}
export default new ConnectionController()