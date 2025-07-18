/**
 * table 并非狭义上的 “表” , 抽象为
 * 1. MySQL 中的 Table
 * 2. MongoDB 中的 Collection
 * 3. Redis 中不存在
 */

import { Context } from 'koa';

import { TableSearchDTO, CreateOrDeleteTableDTO, RenameTableDTO } from '@/dto/table';
import Connection, { ConnectionType } from '@/model/connection';
import { ResourceNotFound } from '@/utils/error';
import mysql from '@/pools/mysql'
import mongoodb from '@/pools/mongodb';
import sequelize from '@/db';

interface GetInstanceParams { 
  uid: number;
  connectionId: string;
  dbName: string;
}

class TableController {
  /**
   * 获取数据库实例
   */
  private getInstance = async (config: GetInstanceParams) => {
    const { connectionId, dbName, uid } = config
    const connection = await Connection.findOne({
      where: { creator: uid, id: connectionId }
    })
    if (!connection) {
      throw new ResourceNotFound(`connectionId = ${connectionId} not exist`)
    }

    const { database, host, port, username, password, type } = connection
    const dbConfig = { database: dbName, host, port, username, password, uid }

    if (type === ConnectionType.MYSQL) {
      return {
        type,
        instance: await mysql.getInstance(dbConfig)
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

  list = async (ctx: Context) => {
    const { connectionId, dbName } = await new TableSearchDTO().v(ctx)
    const { type, instance } = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    let data: { name: string, comment?: string }[] = []
    if (type === ConnectionType.MYSQL) {
      const sql = `
        SELECT 
          TABLE_NAME as name, 
          TABLE_COMMENT as comment
        FROM 
          information_schema.TABLES
        WHERE 
          TABLE_SCHEMA = DATABASE();
      `
      const res = await instance.query(sql)
      data = res[0] as { name: string, comment?: string }[]
    }

    if (type === ConnectionType.MONGODB) {
      const res = await instance.useDb(dbName).listCollections()
      data = res.map(db => ({ name: db.name }))
    }

    ctx.r({ data })
  }

  create = async (ctx: Context) => {
    const { connectionId, dbName, tableName, comment = '' } = await new CreateOrDeleteTableDTO().v(ctx)
    const { type, instance } = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    if (type === ConnectionType.MYSQL) {
      const escapedTableName = instance.getQueryInterface().quoteIdentifier(tableName)
      const escapedComment = sequelize.escape(comment)
      const sql = `
        CREATE TABLE ${escapedTableName} (
          id INT PRIMARY KEY AUTO_INCREMENT,
          demo_hobby VARCHAR(50) DEFAULT 'writing code',
          demo_gender ENUM('Male', 'Female') COMMENT 'gender/性别'
        ) COMMENT ${escapedComment}
      `
      await instance.query(sql)
      ctx.r()
    }
  }

  delete = async (ctx: Context) => {
    const { connectionId, dbName, tableName } = await new CreateOrDeleteTableDTO().v(ctx)
    const { type, instance } = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    if (type === ConnectionType.MYSQL) {
      const escapedTableName = instance.getQueryInterface().quoteIdentifier(tableName)
      const sql = `DROP TABLE ${escapedTableName}`
      const data = await instance.query(sql)
      ctx.r({ data })
    }
  }

  modify = async (ctx: Context) => {
    const { connectionId, dbName, tableName, newTableName, comment = '' } = await new RenameTableDTO().v(ctx)
    const { type, instance } = await this.getInstance({ connectionId, dbName, uid: ctx.user.id })

    if (type === ConnectionType.MYSQL) {
      const escapedTableName = instance.getQueryInterface().quoteIdentifier(tableName)
      const escapedNewTableName = instance.getQueryInterface().quoteIdentifier(newTableName)
      const sql = `ALTER TABLE ${escapedTableName} RENAME TO ${escapedNewTableName}, COMMENT = ${sequelize.escape(comment)}`
      const data = await instance.query(sql)
      ctx.r({ data })
    }
  }
}

export default new TableController()
