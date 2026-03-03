export enum EConnectionType {
  MYSQL = 'mysql',
  MARIADB = 'mariadb',
  REDIS = 'redis',
  MONGODB = 'mongodb',
  PGSQL = 'pgsql',
}

export interface IConnectionPoolConfig {
  uid: number;
  host: string;
  port: number;
  username?: string | null;
  password?: string | null;
  database?: string | null;
  pageId?: string | null;
}
