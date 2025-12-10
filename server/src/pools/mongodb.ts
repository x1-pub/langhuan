import mongoose, { Connection } from 'mongoose';

import { IConnectionPoolConfig } from '@packages/types/connection';
import { removeNullAndUndefined } from '../lib/utils';
import { TRPCError } from '@trpc/server';

interface MongooseInstanceWithTimestamp {
  connection: Connection;
  lastUsed: number;
}

class MongoDBManager {
  private mongooseInstances: Map<string, MongooseInstanceWithTimestamp> = new Map();
  private releaseTime: number = 10 * 60 * 1000;

  constructor() {
    this.startCleanupTask();
  }

  async getInstance(config: IConnectionPoolConfig) {
    const key = JSON.stringify(removeNullAndUndefined(config));
    let instance = this.mongooseInstances.get(key);
    try {
      if (!instance) {
        const connection = await mongoose
          .createConnection(`mongodb://${config.host}:${config.port}/${config.database || ''}`, {
            user: config.username || undefined,
            pass: config.password || undefined,
            serverSelectionTimeoutMS: 10000,
          })
          .asPromise();
        instance = {
          connection,
          lastUsed: Date.now(),
        };
        this.mongooseInstances.set(key, instance);
      } else {
        instance.lastUsed = Date.now();
      }

      return instance.connection;
    } catch (err) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: String(err) });
    }
  }

  changeInstance(config: IConnectionPoolConfig, connection: Connection) {
    const key = JSON.stringify(config);
    const instance = this.mongooseInstances.get(key);
    if (!instance) {
      return;
    }
    instance.lastUsed = Date.now();
    instance.connection = connection;
  }

  private startCleanupTask() {
    setInterval(async () => {
      const now = Date.now();
      for (const [key, instance] of this.mongooseInstances) {
        if (now - instance.lastUsed > this.releaseTime) {
          try {
            instance.connection.destroy();
            this.mongooseInstances.delete(key);
          } catch (error) {
            console.error(`Error closing mongoose instance for key ${key}:`, error);
          }
        }
      }
    }, 60 * 1000);
  }
}

const mongodb = new MongoDBManager();

export default mongodb;
