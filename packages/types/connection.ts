export enum EConnectionType {
  MYSQL = 'mysql',
  REDIS = 'redis',
  MONGODB = 'mongodb',
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
