import mongoose, { Connection } from 'mongoose';

import { ConnectionFailed } from '@/utils/error';

interface MongoDBConfig {
  uid: number;
  host: string;
  port: string | number;
  username?: string;
  password?: string;
  database?: string;
}

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

  getInstance(config: MongoDBConfig) {
    const key = JSON.stringify(config);
    let instance = this.mongooseInstances.get(key);
    return new Promise<Connection>(async (resolve, reject) => {
      try {
        if (!instance) {
          const connection = await mongoose.createConnection(`mongodb://${config.host}:${config.port}/${config.database}`, {
            user: config.username,
            pass: config.password,
            serverSelectionTimeoutMS: 10000,
          }).asPromise()
          instance = {
            connection,
            lastUsed: Date.now()
          };
          this.mongooseInstances.set(key, instance);
        } else {
          instance.lastUsed = Date.now();
        }
        resolve(instance.connection)
      } catch (err) {
        reject(new ConnectionFailed(String(err)))
      }
    })
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

export default mongodb
