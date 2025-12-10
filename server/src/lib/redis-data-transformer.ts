import { ERedisDataType, TRedisValue } from '@packages/types/redis';
import { chunk } from 'lodash-es';

/**
 * 把不用类型的value格式化为同一类型 string[][]
 * 1. STRING: [[value]]
 * 2. LIST:   [[element1, element2, ....]]
 * 3. SET:    [[member1, member2, ....]]
 * 4. HASH:   [[field1, value1], [field2, value2], ...]
 * 5. STREAM: [[id1, field1, value1, fleld2, value2, ...], [id2, field1, value1, fleld2, value2, ...], ...]
 * 6. ZSET:   [[member1, score1], [member2, score2], ...]
 */
export const transformRedisDataToUnified = (type: ERedisDataType, value: unknown): TRedisValue => {
  switch (type) {
    case ERedisDataType.STRING: {
      const v1 = (value as string) || '';
      return [[v1]];
    }
    case ERedisDataType.LIST:
    case ERedisDataType.SET: {
      const v2 = (value as string[]) || [];
      return [v2];
    }
    case ERedisDataType.HASH: {
      const v3 = (value as Record<string, string>) || {};
      return Object.keys(v3 || {}).map(field => [field, v3[field]]);
    }
    case ERedisDataType.STREAM: {
      const v4 = ((value as [[string, unknown]])?.[0]?.[1] as [string, string[]][]) || [];
      return v4.flatMap(([id, fields]) => [[id, ...fields]]);
    }
    case ERedisDataType.ZSET: {
      const v5 = (value as string[]) || [];
      return chunk(v5, 2);
    }
    default:
      return [];
  }
};
