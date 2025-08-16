import { Context } from 'koa';

import mongoodb from '@/pools/mongodb';
import Connection from '@/model/connection';
import { ResourceNotFound } from '@/utils/error';
import { ExecuteMongoDBCommandDTO } from '@/dto/mongodb';
import { formatMongoResult, MongoShellParser } from '@/utils/mongo-shell-parser';

interface GetInstanceParams {
  uid: number;
  connectionId: number;
}

class MongoDBController {
  /**
   * 获取 mongoose 的 MongoDB 实例
   */
  private static async getInstance(config: GetInstanceParams) {
    const { connectionId, uid } = config
    const connection = await Connection.findOne({
      where: { creator: uid, id: connectionId, type: 'mongodb' }
    })
    if (!connection) {
      throw new ResourceNotFound(`connectionId = ${connectionId} not exist`)
    }

    const { database, host, port, username, password } = connection
    const dbConfig = { host, port, username, password, database, uid }

    return mongoodb.getInstance(dbConfig)
  }

  execute = async (ctx: Context) => {
    const { connectionId, command } = await new ExecuteMongoDBCommandDTO().v(ctx)
    const instance = await MongoDBController.getInstance({ connectionId, uid: ctx.user.id })

    const parser = new MongoShellParser(instance)
    const res = await parser.executeCommand(command)

    const result = formatMongoResult(res)
    let changeDatabase = result.match(/switched to db (.+)/)?.[1]

    ctx.r({
      data: {
        result,
        changeDatabase,
      }
    })
  }
}

export default new MongoDBController()
