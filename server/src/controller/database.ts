import { Context } from 'koa';

import Connection, { ConnectionType } from '@/model/connection';
import { ResourceNotFound } from '@/utils/error';
import { DatabaseSearchDTO, CreateOrDeleteDatabaseDTO } from '@/dto/database'
import redis from '@/pools/redis';
import mysql from '@/pools/mysql'
import mongoodb from '@/pools/mongodb';

interface GetInstanceParams { 
  uid: number;
  connectionId: string;
}

class DatabaseController {
  /**
   * 获取数据库实例
   */
  private getInstance = async (config: GetInstanceParams) => {
    const { connectionId, uid } = config
    const connection = await Connection.findOne({
      where: { creator: uid, id: connectionId }
    })
    if (!connection) {
      throw new ResourceNotFound(`connectionId = ${connectionId} not exist`)
    }

    const { database, host, port, username, password, type } = connection
    const dbConfig = { host, port, username, password, uid }

    if (type === ConnectionType.MYSQL) {
      return {
        type,
        instance: await mysql.getInstance(dbConfig)
      }
    }
    if (type === ConnectionType.REDIS) {
      return {
        type,
        instance: await redis.getInstance(dbConfig),
      }
    }
    if (type === ConnectionType.MONGODB) {
      return {
        type,
        instance: await mongoodb.getInstance({ ...dbConfig, database }),
      }
    }

    throw new ResourceNotFound(`connectionType = ${type} error`)
  }

  /**
   * 获取数据库列表
   */
  list = async (ctx: Context) => {
    const { connectionId } = await new DatabaseSearchDTO().v(ctx)
    const { type, instance } = await this.getInstance({ connectionId, uid: ctx.user.id })
    
    let data: { name: string, charset?: string, collation?: string }[] = []
    if (type === ConnectionType.REDIS) {
      const res = await instance.config('GET', 'databases') as string[]
      data = new Array(Number(res[1])).fill(0).map((_, index) => ({ name: String(index) }))
    }

    if (type === ConnectionType.MYSQL) {
      const sql = `
        SELECT 
          SCHEMA_NAME as name , 
          DEFAULT_CHARACTER_SET_NAME as charset,
          DEFAULT_COLLATION_NAME as collation
        FROM 
          information_schema.SCHEMATA;
      `
      const res = await instance.query(sql)
      data = res[0] as { name: string, charset?: string, collation?: string }[]
    }

    if (type === ConnectionType.MONGODB) {
      const res = await instance.listDatabases()
      data = res.databases.map(db => ({ name: db.name }))
    }

    ctx.r({ data })
  }

  /**
   * 创建数据库
   */
  create = async (ctx: Context) => {
    const { connectionId, dbName, charset, collation } = await new CreateOrDeleteDatabaseDTO().v(ctx)
    const { type, instance } = await this.getInstance({ connectionId, uid: ctx.user.id })

    if (type === ConnectionType.MYSQL) {
      const escapedDbName = instance.getQueryInterface().quoteIdentifier(dbName)
      const sqlArray = [`CREATE DATABASE ${escapedDbName}`]
      if (charset) {
        sqlArray.push(`CHARACTER SET ${charset}`)
      }
      if (collation) {
        sqlArray.push(`COLLATE ${collation}`)
      }
      
      const data = await instance.query(sqlArray.join(' '))
      ctx.r()
    }
  }

  /**
   * 修改数据库
   */
  modify = async (ctx: Context) => {
    const { connectionId, dbName, charset, collation } = await new CreateOrDeleteDatabaseDTO().v(ctx)
    const { type, instance } = await this.getInstance({ connectionId, uid: ctx.user.id })

    if (type === ConnectionType.MYSQL) {
      const escapedDbName = instance.getQueryInterface().quoteIdentifier(dbName)
      const sqlArray = [`ALTER DATABASE ${escapedDbName}`]

      if (!charset && !collation) {
        throw new Error('无修改内容')
      }
      if (charset) {
        sqlArray.push(`CHARACTER SET ${charset}`)
      }
      if (collation) {
        sqlArray.push(`COLLATE ${collation}`)
      }
      
      const data = await instance.query(sqlArray.join(' '))
      ctx.r()
    }
  }

  /**
   * 删除数据库
   */
  delete = async (ctx: Context) => {
    const { connectionId, dbName } = await new CreateOrDeleteDatabaseDTO().v(ctx)
    const { type, instance } = await this.getInstance({ connectionId, uid: ctx.user.id })

    if (type === ConnectionType.MYSQL) {
      const escapedDbName = instance.getQueryInterface().quoteIdentifier(dbName)
      const sql = `DROP DATABASE ${escapedDbName}`
      const data = await instance.query(sql)
      ctx.r({ data })
    }

  }
}

export default new DatabaseController()
