import Redis from "ioredis";

import { ConnectionFailed } from '@/utils/error';

interface RedisConfig {
  uid: number;
  host: string;
  port: string | number;
  username?: string;
  password?: string;
  database?: string;
  sessionId?: string;
}

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

  getInstance(config: RedisConfig) {
    const key = JSON.stringify(config);
    let instance = this.redisInstances.get(key);
    return new Promise<Redis>(async (resolve, reject) => {
      try {
        if (!instance) {
          const redis = await new Redis({
            host: config.host,
            port: Number(config.port),
            db: Number(config.database) || undefined,
            username: config.username || undefined,
            password: config.password,
            retryStrategy: (times) => {
              if (times > 3) {
                return null;
              }
              return 1000;
            }
          });
          instance = {
            redis,
            lastUsed: Date.now()
          };
          this.redisInstances.set(key, instance);
        } else {
          instance.lastUsed = Date.now();
        }
        resolve(instance.redis)
      } catch (err) {
        reject(new ConnectionFailed(String(err)))
      }
    })
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

export default redis
