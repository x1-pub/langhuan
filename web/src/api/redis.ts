import request from "@/utils/request";

export enum RedisType {
  HASH = 'hash',
  LIST = 'list',
  SET = 'set',
  ZSET = 'zset',
  STRING = 'string',
  STREAM = 'stream',
}
export interface RedisKeyItem {
  key: string;
  type: RedisType;
  ttl: number;
  size: number;
}

export interface RedisValueRsp {
  size: number;
  ttl: number;
  type: RedisType;
  key: string;
  value: any; // TODO
}

interface GetRedisKeysParams {
  connectionId: string;
  dbName: string;
  cursor: string;
  match?: string;
  type?: RedisType | '';
  count: number;
}

interface RedisKeyListRsp {
  cursor: string;
  list: RedisKeyItem[];
  total: number;
  scanned: number;
}

export const getRedisKeys = (params: GetRedisKeysParams) => request<RedisKeyListRsp>({
  method: 'GET',
  params,
  url: '/api/redis/redis_keys',
})

interface GetRedisValueParams {
  connectionId: string;
  dbName: string;
  key: string;
  type?: RedisType;
}

export const getRedisValue = (params: GetRedisValueParams) => request<RedisValueRsp>({
  method: 'GET',
  params,
  url: '/api/redis/redis_value',
})

interface AddRedisValueParams {
  connectionId: string;
  dbName: string;
  key: string;
  type: RedisType;
  ttl?: number;
  value?: any;
}

export const addRedisValue = (data: AddRedisValueParams) => request<void>({
  method: 'POST',
  data,
  url: '/api/redis/redis_add_value',
})

interface DeleteRedisValueParams {
  connectionId: string;
  dbName: string;
  key: string;
}

export const deleteRedisValue = (data: DeleteRedisValueParams) => request<void>({
  method: 'POST',
  data,
  url: '/api/redis/redis_delete_value',
})


interface ExecuteRedisCommandParams {
  connectionId: number;
  command: string;
  sessionId: string;
}

export const executeRedisCommand = (data: ExecuteRedisCommandParams) => request<{ result: string, changeDatabase?: string; }>({
  method: 'POST',
  data,
  url: '/api/redis/redis_execute',
})
