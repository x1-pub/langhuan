import { z } from 'zod';

import { ERedisDataType } from '../types/redis';

const RedisBaseSchema = z.object({
  connectionId: z.int(),
  dbName: z.string(),
});

export const RedisValueSchema = z.array(z.array(z.string()));

export const GetRedisKeysSchema = RedisBaseSchema.extend({
  type: z.enum(Object.values(ERedisDataType)).optional(),
  cursor: z.int().nullish(),
  count: z.int(),
  match: z.string(),
});

export const GetRedisValueSchema = RedisBaseSchema.extend({
  type: z.enum(Object.values(ERedisDataType)),
  key: z.string(),
});

export const AddRedisValueSchema = GetRedisValueSchema.extend({
  ttl: z.int().optional(),
  value: RedisValueSchema,
});

export const DeleteRedisKey = RedisBaseSchema.extend({
  key: z.string(),
});

export const ModifyRedisTTL = RedisBaseSchema.extend({
  key: z.string(),
  ttl: z.number(),
});

export const ModifyRedisKey = RedisBaseSchema.extend({
  key: z.string(),
  newKey: z.string(),
});

export const UpdateRedisKey = RedisBaseSchema.extend({
  key: z.string(),
  newKey: z.string(),
});

export const UpdateRedisTTL = RedisBaseSchema.extend({ ttl: z.int() });

export const UpdateRedisValue = RedisBaseSchema.extend({
  key: z.string(),
  value: RedisValueSchema,
});

export const ExecuteRedisCommand = z.object({
  connectionId: z.int(),
  command: z.string(),
  pageId: z.string(),
});

export const UpdateHashValueSchema = RedisBaseSchema.extend({
  key: z.string(),
  field: z.string(),
  value: z.string(),
  isRemove: z.boolean().optional(),
});

export const UpdateStringValueSchema = RedisBaseSchema.extend({
  key: z.string(),
  value: z.string(),
});

export const UpdateListValueSchema = RedisBaseSchema.extend({
  key: z.string(),
  element: z.string(),
  index: z.int().optional(),
  isRemove: z.boolean().optional(),
  isModify: z.boolean().optional(),
  isPushToHead: z.boolean().optional(),
});

export const UpdateSetValueSchema = RedisBaseSchema.extend({
  key: z.string(),
  member: z.string(),
  isRemove: z.boolean().optional(),
});

export const UpdateZsetValueSchema = RedisBaseSchema.extend({
  key: z.string(),
  member: z.string(),
  score: z.number().optional(),
  isRemove: z.boolean().optional(),
});

export const UpdateStreamValueSchema = RedisBaseSchema.extend({
  key: z.string(),
  entry: z.array(z.array(z.string())),
  isRemove: z.boolean().optional(),
});
