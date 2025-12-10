import Redis from 'ioredis';

import { IConnectionPoolConfig } from '@packages/types/connection';
import { removeNullAndUndefined } from '../lib/utils';
import { TRPCError } from '@trpc/server';

interface RedisInstanceWithTimestamp {
  redis: Redis;
  lastUsed: number;
}

class RedisManager {
  private redisInstances: Map<string, RedisInstanceWithTimestamp> = new Map();
  private releaseTime: number = 10 * 60 * 1000;

  constructor() {
    this.startCleanupTask();
  }

  async getInstance(config: IConnectionPoolConfig) {
    const key = JSON.stringify(removeNullAndUndefined(config));
    let instance = this.redisInstances.get(key);
    try {
      if (!instance) {
        const redis = await new Redis({
          host: config.host,
          port: Number(config.port),
          db: Number(config.database) || undefined,
          username: config.username || undefined,
          password: config.password || undefined,
          retryStrategy: times => {
            if (times > 3) {
              return null;
            }
            return 1000;
          },
        });
        instance = {
          redis,
          lastUsed: Date.now(),
        };
        this.redisInstances.set(key, instance);
      } else {
        instance.lastUsed = Date.now();
      }

      return instance.redis
    } catch (err) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: String(err) })
    }
  }

  private startCleanupTask() {
    setInterval(async () => {
      const now = Date.now();
      for (const [key, instance] of this.redisInstances) {
        if (now - instance.lastUsed > this.releaseTime) {
          try {
            instance.redis.quit();
            this.redisInstances.delete(key);
          } catch (error) {
            console.error(`Error closing redis instance for key ${key}:`, error);
          }
        }
      }
    }, 60 * 1000);
  }
}

const redis = new RedisManager();

export default redis;
