import { isInt, isIn, isLength } from 'validator'
import { Rule, Validator } from '@/utils/validator'

export interface RedisBaseParams {
  connectionId: number;
  dbName?: string;
}

export enum RedisType {
  HASH = 'hash',
  LIST = 'list',
  SET = 'set',
  ZSET = 'zset',
  STRING = 'string',
  STREAM = 'stream',
}
interface RedisSearchParams extends RedisBaseParams {
  cursor?: number | string;
  type?: RedisType;
  count: string;
  match?: string;
}

export class RedisSearchDTO extends Validator<RedisSearchParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isInt, 'dbName', { min: 0 }),
      new Rule(isInt, 'count', { min: 0 }),
      new Rule(isIn, 'type', [...Object.values(RedisType), '']).allowNull(),
      new Rule(isLength, 'match'),
    ]
  }
}

interface GetValueParams extends RedisBaseParams {
  key: string;
  type?: RedisType;
}
export class RedisGetValueDTO extends Validator<GetValueParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isInt, 'dbName', { min: 0 }),
      new Rule(isLength, 'key', { min: 1 }),
      new Rule(isIn, 'type', Object.values(RedisType)).allowNull(),
    ]
  }
}

interface AddValueParams extends RedisBaseParams {
  key: string;
  type: RedisType;
  ttl?: number;
  value: any;
}

export class RedisAddValueDTO extends Validator<AddValueParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isInt, 'dbName', { min: 0 }),
      new Rule(isLength, 'key', { min: 1 }),
      new Rule(isInt, 'ttl', { min: -1 }).allowNull(),
      new Rule(isIn, 'type', Object.values(RedisType)),
    ]
  }
}

interface DeleteValueParams extends RedisBaseParams {
  key: string;
}

export class RedisDeleteValueDTO extends Validator<DeleteValueParams> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isInt, 'dbName', { min: 0 }),
      new Rule(isLength, 'key', { min: 1 }),
    ]
  }
}

interface ExecuteRedisCommand {
  connectionId: number;
  command: string;
  sessionId: string;
}

export class ExecuteRedisCommandDTO extends Validator<ExecuteRedisCommand> {
  useRules() {
    return [
      new Rule(isInt, 'connectionId'),
      new Rule(isLength, 'command', { min: 1 }),
      new Rule(isLength, 'sessionId', { min: 1 }),
    ]
  }
}
