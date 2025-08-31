import { Context } from 'koa';

import redis from '@/pools/redis';
import Connection from '@/model/connection';
import { ResourceNotFound } from '@/utils/error';
import {
  RedisSearchDTO,
  RedisGetValueDTO,
  RedisType,
  RedisAddValueDTO,
  RedisDeleteValueDTO,
  ExecuteRedisCommandDTO,
  RedisModifyTTLDTO,
  RedisModifyKeyDTO,
  ModifyValueDTO,
} from '@/dto/redis';
import { formatRedisResult } from '@/utils/redis-result-formatter';
import { parseRedisCommand } from '@/utils/redis-shell-parser';

interface GetInstanceParams {
  connectionId: number;
  dbName?: string
  uid: number;
  sessionId?: string
}

class RedisController {
  /**
   * 获取 ioredis 的 Redis 实例
   */
  private static async getInstance(config: GetInstanceParams) {
    const { connectionId, dbName, uid, sessionId } = config
    const connection = await Connection.findOne({
      where: { creator: uid, id: connectionId, type: 'redis' }
    })
    if (!connection) {
      throw new ResourceNotFound(`connectionId = ${connectionId} not exist`)
    }

    const { host, port, username, password } = connection
    const ioredis = await redis.getInstance({ database: dbName, host, port, username, password, uid, sessionId })

    return ioredis
  }

  /**
   * 根据游标 cursor 获取 (key type ttl) 列表
   */
  async onlyKeys(ctx: Context) {
    const { connectionId, dbName, cursor = '0', count, match = '*', type } = await new RedisSearchDTO().v(ctx)
    const ioredis = await RedisController.getInstance({ connectionId, dbName, uid: ctx.user.id })

    let scanCount = 0;
    let scanCursor;
    const resultKeys = []
    while (scanCount < 10000 && scanCursor !== '0' && resultKeys.length < Number(count)) {
      const args = [scanCursor || cursor, 'MATCH', match || '*', "COUNT", count]
      if (type) {
        args.push('TYPE', type)
      }
      // @ts-ignore
      const [nextCursor, keys] = await ioredis.scan(...args);
      scanCursor = nextCursor as string
      scanCount += Number(count)
      resultKeys.push(...keys)
    }

    const pipe = ioredis.pipeline()
    resultKeys.forEach(key => {
      pipe.type(key).ttl(key).memory('USAGE', key)
    })
    const values = await pipe.exec() || []
    const list: any[] = []
    for (let i = 0; i < values.length; i += 3) {
      list.push({
        key: resultKeys[i / 3],
        type: values[i][1],
        ttl: values[i + 1][1],
        size: values[i + 2][1],
      })
    }

    const total = await ioredis.dbsize();

    ctx.r({
      data: {
        cursor: scanCursor,
        list,
        total,
        scanned: scanCount,
      }
    })
  }

  /**
   * 根据 key 获取详情 (value ttl size type)
   */
  async getValue(ctx: Context) {
    const { connectionId, dbName, key, type } = await new RedisGetValueDTO().v(ctx)
    const ioredis = await RedisController.getInstance({ connectionId, dbName, uid: ctx.user.id })

    const k = type || await ioredis.type(key)
    const pipe = ioredis.pipeline()
    switch (k) {
      case RedisType.STRING:
        pipe.get(key);
        break;
      case RedisType.LIST:
        pipe.lrange(key, 0, -1);
        break;
      case RedisType.SET:
        pipe.smembers(key);
        break;
      case RedisType.HASH:
        pipe.hgetall(key);
        break;
      case RedisType.ZSET:
        pipe.zrange(key, 0, -1, 'WITHSCORES');
        break;
      case RedisType.STREAM:
        pipe.xread('STREAMS', key, '0');
        break;
    }

    pipe.ttl(key).memory('USAGE', key)

    const [value = [], ttl = [], size = []] = await pipe.exec() || []
    const res = k === RedisType.STREAM ? (value as any)[1]?.[0]?.[1] || [] : value[1]

    ctx.r({
      data: {
        value: res,
        ttl: ttl[1],
        size: size[1],
        type: k,
        key,
      }
    })
  }

  addValue = async (ctx: Context) => {
    const { connectionId, dbName, key, type, ttl = -1, value } = await new RedisAddValueDTO().v(ctx)
    const ioredis = await RedisController.getInstance({ connectionId, dbName, uid: ctx.user.id })

    const pipe = ioredis.pipeline()

    switch (type) {
      case RedisType.STRING:
        pipe.set(key, value);
        break;
      case RedisType.LIST:
        const listValue = Array.isArray(value.elements) ? value.elements : []
        if (value.pushToHead) {
          pipe.lpush(key, ...listValue)
        } else {
          pipe.rpush(key, ...listValue)
        }
        break;
      case RedisType.SET:
        const setValue = Array.isArray(value) ? value : []
        await ioredis.sadd(key, ...setValue);
        break;
      case RedisType.HASH:
        let hashValue: Record<string, string> = {}
        if (Array.isArray(value)) {
          value.forEach(item => {
            hashValue[item.field] = item.value
          })
        }
        pipe.hset(key, hashValue)
        break;
      case RedisType.ZSET:
        const zsetValue = Array.isArray(value) ? value : []
        const zsetWithArray: (string | number)[] = []
        zsetValue.forEach(item => {
          zsetWithArray.push(Number(item.score))
          zsetWithArray.push(item.member)
        })
        pipe.zadd(key, ...zsetWithArray)
        break;
      case RedisType.STREAM:
        const [id, values] = value[0]
        await ioredis.xadd(key, id, ...values);
        break;
    }

    if (ttl != null && Number(ttl) !== -1) {
      pipe.expire(key, ttl)
    }
    const [res] = await pipe.exec() || [[]]

    if (res?.[0]) {
      throw res[0]
    }

    ctx.r({
      data: res?.[1]
    })
  }

  delete = async (ctx: Context) => {
    const { connectionId, dbName, key } = await new RedisDeleteValueDTO().v(ctx)
    const ioredis = await RedisController.getInstance({ connectionId, dbName, uid: ctx.user.id })

    const data = await ioredis.del(key)

    ctx.r({ data })
  }

  execute = async (ctx: Context) => {
    const { connectionId, command, sessionId } = await new ExecuteRedisCommandDTO().v(ctx)
    const ioredis = await RedisController.getInstance({ connectionId, uid: ctx.user.id, sessionId })

    const parts = parseRedisCommand(command)
    const [cmd, ...args] = parts;

    const res = await ioredis.call(cmd, ...args)
    const result = formatRedisResult(res)

    ctx.r({
      data: {
        result,
        changeDatabase: cmd.toLowerCase() === 'select' ? `[db${args[0]}]` : undefined
      }
    })
  }

  modifyTTL = async (ctx: Context) => {
    const { connectionId, dbName, key, ttl } = await new RedisModifyTTLDTO().v(ctx)
    const ioredis = await RedisController.getInstance({ connectionId, dbName, uid: ctx.user.id })

    let result: number
    if (ttl >= 0) {
      result = await ioredis.expire(key, ttl)
    } else {
      result = await ioredis.persist(key)
    }
    ctx.r({ data: result })
  }

  modifyKey = async (ctx: Context) => {
    const { connectionId, dbName, key, newKey } = await new RedisModifyKeyDTO().v(ctx)
    const ioredis = await RedisController.getInstance({ connectionId, dbName, uid: ctx.user.id })
    const result = await ioredis.renamenx(key, newKey)
    ctx.r({ data: result })
  }

  modifyValue = async (ctx: Context) => {
    const { connectionId, dbName, type, key, value } = await new ModifyValueDTO().v(ctx)
    const ioredis = await RedisController.getInstance({ connectionId, dbName, uid: ctx.user.id })

    let result
    switch (type) {
      case RedisType.STRING:
        result = await ioredis.set(key, value)
        break;
      case RedisType.LIST:
        if (value.modify) {
          result = await ioredis.lset(key, value.modify.index, value.modify.value)
        } else if (value.remove || value.remove === '') {
          result = await ioredis.lrem(key, 1, value.remove)
        } else if (value.save) {
          if (value.save.pushToHead) {
            result = await ioredis.lpush(key, value.save.value)
          } else {
            result = await ioredis.rpush(key, value.save.value)
          }
        }
        break;
      case RedisType.SET:
        break;
      case RedisType.HASH:
        if (value.remove || value.remove === '') {
          result = await ioredis.hdel(key, value.remove)
        } else if (value.modify) {
          result = await ioredis.hset(key, value.modify.field, value.modify.value)
        } else if (value.save) {
          result = await ioredis.hset(key, value.save.field, value.save.value)
        }
        break;
      case RedisType.ZSET:
        break;
      case RedisType.STREAM:
        break;
    }
    // const result = await ioredis.renamenx(key, newKey)
    ctx.r({ data: result })
  }
}

export default new RedisController()
