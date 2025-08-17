import { Sequelize } from 'sequelize';

import { ConnectionFailed } from '@/utils/error';

interface MysqlConfig {
  uid: number;
  host: string;
  port: string | number;
  username?: string;
  password?: string;
  database?: string;
  sessionId?: string;
}

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

  getInstance(config: MysqlConfig) {
    const key = JSON.stringify(config);
    let instance = this.sequelizeInstances.get(key);
    return new Promise<Sequelize>(async (resolve, reject) => {
      try {
        if (!instance) {
          const sequelize = new Sequelize({
            database: config.database || undefined,
            host: config.host,
            port: Number(config.port),
            username: config.username,
            password: config.password,
            dialect: 'mysql',
            logging: false,
          });
          await sequelize.authenticate()
          instance = {
            sequelize,
            lastUsed: Date.now()
          };
          this.sequelizeInstances.set(key, instance);
        } else {
          instance.lastUsed = Date.now();
        }
        resolve(instance.sequelize)
      } catch (err) {
        reject(new ConnectionFailed(String(err)))
      }
    })
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

export default mysql
