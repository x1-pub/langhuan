import { TRPCError } from '@trpc/server';
import { Pool, types } from 'pg';

import { IConnectionPoolConfig } from '@packages/types/connection';
import { removeNullAndUndefined } from '../shared/object/remove-nullish';

interface PgsqlInstanceWithTimestamp {
  pool: Pool;
  lastUsed: number;
}

// Keep SQL date/time values as strings to prevent implicit JS Date timezone conversion.
const PGSQL_RAW_TIME_OIDS = [1082, 1083, 1114, 1184, 1266];
PGSQL_RAW_TIME_OIDS.forEach(oid => {
  types.setTypeParser(oid, value => value);
});

class PgsqlManager {
  private poolInstances: Map<string, PgsqlInstanceWithTimestamp> = new Map();
  private releaseTime: number = 10 * 60 * 1000;

  constructor() {
    this.startCleanupTask();
  }

  async getInstance(config: IConnectionPoolConfig) {
    const key = JSON.stringify(removeNullAndUndefined(config));
    let instance = this.poolInstances.get(key);

    try {
      if (!instance) {
        const pool = new Pool({
          host: config.host,
          port: Number(config.port),
          user: config.username || undefined,
          password: config.password || undefined,
          database: config.database || 'postgres',
          options: '-c timezone=UTC',
          max: 10,
          connectionTimeoutMillis: 10_000,
          idleTimeoutMillis: 30_000,
        });
        await pool.query('SELECT 1');

        instance = {
          pool,
          lastUsed: Date.now(),
        };
        this.poolInstances.set(key, instance);
      } else {
        instance.lastUsed = Date.now();
      }

      return instance.pool;
    } catch (err) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: String(err),
      });
    }
  }

  private startCleanupTask() {
    setInterval(async () => {
      const now = Date.now();
      for (const [key, instance] of this.poolInstances) {
        if (now - instance.lastUsed > this.releaseTime) {
          try {
            await instance.pool.end();
            this.poolInstances.delete(key);
          } catch (error) {
            console.error(`Error closing pgsql instance for key ${key}:`, error);
          }
        }
      }
    }, 60 * 1000);
  }
}

const pgsql = new PgsqlManager();

export default pgsql;
