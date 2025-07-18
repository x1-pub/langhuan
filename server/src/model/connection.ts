import { DataTypes, Model } from 'sequelize'

import sequelize from '@/db/index'

export enum ConnectionType {
  MYSQL = 'mysql',
  REDIS = 'redis',
  MONGODB = 'mongodb',
}
interface IConnection {
  id?: number;
  type: ConnectionType;
  name: string;
  host: string;
  port: string;
  username?: string;
  password?: string;
  database?: string;
  creator: number;
  createdAt?: number;
  updatedAt?: number;
  deletedAt?: number;
}
type ConnectionInstance = Model<IConnection> & IConnection

const Connection = sequelize.define<ConnectionInstance>(
  'Connection',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      comment: '主键'
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ConnectionType)),
      allowNull: false,
      comment: '连接的类型',
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '连接的名称',
    },
    host: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '连接的主机IP',
    },
    port: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: '连接的端口',
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '用户名',
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '密码',
    },
    database: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '验证数据库名',
    },
    creator: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '创建者',
    },
  },
  {
    tableName: 'connections',
    comment: '所有数据库连接信息',
    paranoid: true,
  }
);

export default Connection