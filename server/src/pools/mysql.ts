import { Sequelize } from 'sequelize';

import { IConnectionPoolConfig } from '@packages/types/connection';
import { removeNullAndUndefined } from '../lib/utils';
import { TRPCError } from '@trpc/server';

interface SequelizeInstanceWithTimestamp {
  sequelize: Sequelize;
  lastUsed: number;
}

class MysqlManager {
  private sequelizeInstances: Map<string, SequelizeInstanceWithTimestamp> = new Map();
  private releaseTime: number = 10 * 60 * 1000;

  constructor() {
    this.startCleanupTask();
  }

  async getInstance(config: IConnectionPoolConfig) {
    const key = JSON.stringify(removeNullAndUndefined(config));
    let instance = this.sequelizeInstances.get(key);
    try {
      if (!instance) {
        const sequelize = new Sequelize({
          database: config.database || undefined,
          host: config.host,
          port: Number(config.port),
          username: config.username || undefined,
          password: config.password || undefined,
          dialect: 'mysql',
          logging: false,
        });
        await sequelize.authenticate();
        instance = {
          sequelize,
          lastUsed: Date.now(),
        };
        this.sequelizeInstances.set(key, instance);
      } else {
        instance.lastUsed = Date.now();
      }

      return instance.sequelize;
    } catch (err) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: String(err) });
    }
  }

  private startCleanupTask() {
    setInterval(async () => {
      const now = Date.now();
      for (const [key, instance] of this.sequelizeInstances) {
        if (now - instance.lastUsed > this.releaseTime) {
          try {
            instance.sequelize.close();
            this.sequelizeInstances.delete(key);
          } catch (error) {
            console.error(`Error closing sequelize instance for key ${key}:`, error);
          }
        }
      }
    }, 60 * 1000);
  }
}

const mysql = new MysqlManager();

export default mysql;
