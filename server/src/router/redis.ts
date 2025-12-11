import {
  AddRedisValueSchema,
  DeleteRedisKey,
  GetRedisKeysSchema,
  GetRedisValueSchema,
  ModifyRedisKey,
  ModifyRedisTTL,
  UpdateHashValueSchema,
  UpdateListValueSchema,
  UpdateSetValueSchema,
  UpdateStreamValueSchema,
  UpdateStringValueSchema,
  UpdateZsetValueSchema,
} from '@packages/zod/redis';
import { protectedProcedure, router } from '../trpc';
import { TRPCError } from '@trpc/server';
import { ERedisDataType } from '@packages/types/redis';
import { transformRedisDataToUnified } from '../lib/redis-data-transformer';

interface IRedisKey {
  key: string;
  type: ERedisDataType;
  ttl: number;
  size: number;
}

export const redisRouter = router({
  getKeys: protectedProcedure.input(GetRedisKeysSchema).query(async ({ ctx, input }) => {
    const { connectionId, type, count, match, dbName, cursor } = input;
    const instance = await ctx.pool.getRedislInstance(connectionId, dbName);

    let scanned = 0;
    let nextCursor = cursor || 0;
    const keys: string[] = [];

    while (scanned < 10000 && keys.length < Number(count)) {
      const args = [nextCursor, 'MATCH', match, 'COUNT', count, ...(type ? ['TYPE', type] : [])];
      const [newCuruor, keyList] = await instance.scan(
        ...(args as Parameters<typeof instance.scan>),
      );
      nextCursor = Number(newCuruor);
      scanned += Number(count);
      keys.push(...keyList);

      if (nextCursor === 0) {
        break;
      }
    }

    const pipe = instance.pipeline();
    keys.forEach(key => {
      pipe.type(key).ttl(key).memory('USAGE', key);
    });

    const res = await pipe.exec();
    if (!res) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'An unexpected error occurred while executing the Redis command.',
      });
    }

    const items: IRedisKey[] = [];
    for (let i = 0; i < res.length; i += 3) {
      const [error] = res[i];
      if (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: String(error) });
      }

      items.push({
        key: keys[i / 3],
        type: res[i][1] as ERedisDataType,
        ttl: res[i + 1][1] as number,
        size: res[i + 2][1] as number,
      });
    }

    const total = await instance.dbsize();

    return {
      nextCursor,
      items,
      total,
      scanned,
    };
  }),

  getValue: protectedProcedure.input(GetRedisValueSchema).query(async ({ ctx, input }) => {
    const { connectionId, type, key, dbName } = input;

    const instance = await ctx.pool.getRedislInstance(connectionId, dbName);
    const pipe = instance.pipeline();
    switch (type) {
      case ERedisDataType.STRING:
        pipe.get(key);
        break;
      case ERedisDataType.LIST:
        pipe.lrange(key, 0, -1);
        break;
      case ERedisDataType.SET:
        pipe.smembers(key);
        break;
      case ERedisDataType.HASH:
        pipe.hgetall(key);
        break;
      case ERedisDataType.ZSET:
        pipe.zrange(key, 0, -1, 'WITHSCORES');
        break;
      case ERedisDataType.STREAM:
        pipe.xread('STREAMS', key, '0');
        break;
    }

    pipe.ttl(key).memory('USAGE', key);

    const res = await pipe.exec();
    if (!res) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'An unexpected error occurred while executing the Redis command.',
      });
    }

    const [[valueError, value], [ttlError, ttl], [sizeError, size]] = res;
    if (valueError || ttlError || sizeError) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: String(valueError || ttlError || sizeError),
      });
    }

    return {
      type,
      ttl: ttl as number,
      size: size as number,
      key,
      value: transformRedisDataToUnified(type, value),
    };
  }),

  addValue: protectedProcedure.input(AddRedisValueSchema).mutation(async ({ ctx, input }) => {
    const { connectionId, type, ttl, value, key, dbName } = input;
    const instance = await ctx.pool.getRedislInstance(connectionId, dbName);
    const pipe = instance.pipeline();

    switch (type) {
      case ERedisDataType.STRING:
        pipe.set(key, value[0][0]);
        break;
      case ERedisDataType.LIST:
        pipe.lpush(key, ...value[0]);
        break;
      case ERedisDataType.SET:
        await pipe.sadd(key, ...value[0]);
        break;
      case ERedisDataType.HASH:
        pipe.hset(key, ...value.flatMap(v => v));
        break;
      case ERedisDataType.ZSET:
        pipe.zadd(key, ...value.flatMap(([member, score]) => [Number(score), member]));
        break;
      case ERedisDataType.STREAM:
        pipe.xadd(key, ...value[0]);
        break;
    }

    if (ttl || ttl === 0) {
      pipe.expire(key, ttl);
    }

    await pipe.exec();
    return null;
  }),

  updateHashValue: protectedProcedure
    .input(UpdateHashValueSchema)
    .mutation(async ({ ctx, input }) => {
      const { connectionId, field, value, key, dbName, isRemove } = input;
      const instance = await ctx.pool.getRedislInstance(connectionId, dbName);

      if (isRemove) {
        await instance.hdel(key, field);
        return null;
      }

      await instance.hset(key, field, value);
      return null;
    }),

  updateStringValue: protectedProcedure
    .input(UpdateStringValueSchema)
    .mutation(async ({ ctx, input }) => {
      const { connectionId, value, key, dbName } = input;
      const instance = await ctx.pool.getRedislInstance(connectionId, dbName);

      await instance.set(key, value);
      return null;
    }),

  updateListValue: protectedProcedure
    .input(UpdateListValueSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        connectionId,
        element,
        key,
        dbName,
        index = 0,
        isRemove,
        isModify,
        isPushToHead,
      } = input;
      const instance = await ctx.pool.getRedislInstance(connectionId, dbName);

      if (isModify) {
        await instance.lset(key, index, element);
        return null;
      }

      if (isRemove) {
        await instance.lrem(key, 1, element);
        return null;
      }

      if (isPushToHead) {
        await instance.lpush(key, element);
        return null;
      }

      await instance.rpush(key, element);
      return null;
    }),

  updateSetValue: protectedProcedure
    .input(UpdateSetValueSchema)
    .mutation(async ({ ctx, input }) => {
      const { connectionId, member, key, dbName, isRemove } = input;
      const instance = await ctx.pool.getRedislInstance(connectionId, dbName);

      if (isRemove) {
        await instance.srem(key, member);
        return null;
      }

      await instance.sadd(key, member);
      return null;
    }),

  updateZsetValue: protectedProcedure
    .input(UpdateZsetValueSchema)
    .mutation(async ({ ctx, input }) => {
      const { connectionId, member, key, dbName, isRemove, score = 0 } = input;
      const instance = await ctx.pool.getRedislInstance(connectionId, dbName);

      if (isRemove) {
        await instance.zrem(key, member);
        return null;
      }

      await instance.zadd(key, score, member);
      return null;
    }),

  updateStreamValue: protectedProcedure
    .input(UpdateStreamValueSchema)
    .mutation(async ({ ctx, input }) => {
      const { connectionId, key, dbName, isRemove, entry } = input;
      const instance = await ctx.pool.getRedislInstance(connectionId, dbName);

      if (isRemove) {
        await instance.xdel(key, entry[0][0]);
        return null;
      }

      await instance.xadd(key, ...entry[0]);
      return null;
    }),

  deleteKey: protectedProcedure.input(DeleteRedisKey).mutation(async ({ ctx, input }) => {
    const { connectionId, key, dbName } = input;
    const instance = await ctx.pool.getRedislInstance(connectionId, dbName);

    await instance.del(key);
    return null;
  }),

  modifyTTL: protectedProcedure.input(ModifyRedisTTL).mutation(async ({ ctx, input }) => {
    const { connectionId, key, ttl, dbName } = input;
    const instance = await ctx.pool.getRedislInstance(connectionId, dbName);

    if (ttl >= 0) {
      await instance.expire(key, ttl);
    } else {
      await instance.persist(key);
    }
    return null;
  }),

  modifyKey: protectedProcedure.input(ModifyRedisKey).mutation(async ({ ctx, input }) => {
    const { connectionId, key, newKey, dbName } = input;
    const instance = await ctx.pool.getRedislInstance(connectionId, dbName);

    await instance.renamenx(key, newKey);
    return null;
  }),
});

export default redisRouter;
