import { Context } from 'koa';
import type { Connection as OConnection } from 'mongoose';

import mongoodb from '@/pools/mongodb';
import Connection from '@/model/connection';
import { ResourceNotFound } from '@/utils/error';
import { ExecuteMongoDBCommandDTO } from '@/dto/mongodb';
import { formatMongoResult, MongoShellParser } from '@/utils/mongo-shell-parser';

interface GetInstanceParams {
  connectionId: string;
  uid: number;
  sessionId?: string;
}

class MongoDBController {
  /**
   * 获取 mongoose 的 MongoDB 实例
   */
  private static async getInstance(config: GetInstanceParams) {
    const { connectionId, uid, sessionId } = config
    const connection = await Connection.findOne({
      where: { creator: uid, id: connectionId, type: 'mongodb' }
    })
    if (!connection) {
      throw new ResourceNotFound(`connectionId = ${connectionId} not exist`)
    }

    const { database, host, port, username, password } = connection
    const dbConfig = { host, port, username, password, database, uid, sessionId }

    return mongoodb.getInstance(dbConfig)
  }

  /**
   * 改变 mongoose 的 MongoDB 实例
   */
  private static async changeInstance(config: GetInstanceParams, newConnection: OConnection) {
    const { connectionId, uid, sessionId } = config
    const connection = await Connection.findOne({
      where: { creator: uid, id: connectionId, type: 'mongodb' }
    })
    if (!connection) {
      throw new ResourceNotFound(`connectionId = ${connectionId} not exist`)
    }

    const { database, host, port, username, password } = connection
    const dbConfig = { host, port, username, password, database, uid, sessionId }

    return mongoodb.changeInstance(dbConfig, newConnection)
  }

  execute = async (ctx: Context) => {
    const { connectionId, command, sessionId } = await new ExecuteMongoDBCommandDTO().v(ctx)
    const config = { connectionId, uid: ctx.user.id, sessionId }
    const instance = await MongoDBController.getInstance(config)

    const parser = new MongoShellParser(instance)
    const res = await parser.executeCommand(command)

    const result = formatMongoResult(res)
    const changeDatabase = result.match(/switched to db (.+)/)?.[1]

    if (changeDatabase) {
      await MongoDBController.changeInstance(config, instance.useDb(changeDatabase))
    }

    ctx.r({
      data: {
        result,
        changeDatabase,
      }
    })
  }
}

export default new MongoDBController()
