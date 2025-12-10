import z from 'zod';

import { RedisValueSchema } from '../zod/redis';

export enum ERedisDataType {
  HASH = 'hash',
  LIST = 'list',
  SET = 'set',
  ZSET = 'zset',
  STRING = 'string',
  STREAM = 'stream',
}

export type TRedisKeyViewType = 'list' | 'tree';

export type TRedisValue = z.infer<typeof RedisValueSchema>;
