import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { drizzle } from 'drizzle-orm/mysql2';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';
import { TRPCError } from '@trpc/server';
import { EConnectionType, IConnectionPoolConfig } from '@packages/types/connection';

import mysql from './pools/mysql';
import redis from './pools/redis';
import mongodb from './pools/mongodb';
import pgsql from './pools/pgsql';
import * as schema from './schema';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = drizzle(process.env.DATABASE_URL as string, { schema, mode: 'default' });
const MYSQL_COMPATIBLE_TYPES = [EConnectionType.MYSQL, EConnectionType.MARIADB] as const;
type ConnectionRecord = typeof schema.connectionsTable.$inferSelect;

const createNotFoundError = (databaseTypeName: string, connectionId: number) =>
  new TRPCError({
    code: 'NOT_FOUND',
    message: `The ${databaseTypeName} connection instance (ID: ${connectionId}) does not exist.`,
  });

const createContext = async ({ req, res }: CreateFastifyContextOptions) => {
  const uid = Number(req.headers['sso-uid-id']) || Number(process.env.DEV_USER_ID);
  const getConnectionByTypes = async (
    connectionId: number,
    connectionTypes: readonly EConnectionType[],
    databaseTypeName: string,
  ) => {
    const connection = await db.query.connectionsTable.findFirst({
      where: table =>
        and(
          eq(table.creator, uid),
          eq(table.id, connectionId),
          isNull(table.deletedAt),
          inArray(table.type, connectionTypes as EConnectionType[]),
        ),
    });

    if (!connection) {
      throw createNotFoundError(databaseTypeName, connectionId);
    }

    return connection;
  };
  const createPoolConfig = (
    connection: Pick<ConnectionRecord, 'host' | 'port' | 'username' | 'password' | 'database'>,
    overrides?: {
      database?: string | null;
      pageId?: string;
    },
  ): IConnectionPoolConfig => {
    const hasDatabaseOverride =
      Boolean(overrides) && Object.prototype.hasOwnProperty.call(overrides, 'database');
    return {
      uid,
      host: connection.host,
      port: connection.port,
      username: connection.username,
      password: connection.password,
      database: hasDatabaseOverride ? overrides?.database : connection.database,
      pageId: overrides?.pageId,
    };
  };
  const getMysqlInstance = async (connectionId: number, databaseName?: string, pageId?: string) => {
    const connection = await getConnectionByTypes(
      connectionId,
      MYSQL_COMPATIBLE_TYPES,
      'MySQL/MariaDB',
    );
    return mysql.getInstance(
      createPoolConfig(connection, {
        database: databaseName,
        pageId,
      }),
    );
  };
  const getPgsqlInstance = async (connectionId: number, databaseName?: string, pageId?: string) => {
    const connection = await getConnectionByTypes(
      connectionId,
      [EConnectionType.PGSQL],
      'PostgreSQL',
    );
    return pgsql.getInstance(
      createPoolConfig(connection, {
        database: databaseName || connection.database || 'postgres',
        pageId,
      }),
    );
  };
  const getRedisInstance = async (connectionId: number, databaseName?: string, pageId?: string) => {
    const connection = await getConnectionByTypes(connectionId, [EConnectionType.REDIS], 'Redis');
    return redis.getInstance(
      createPoolConfig(connection, {
        database: databaseName,
        pageId,
      }),
    );
  };
  const getMongoDbInstance = async (
    connectionId: number,
    databaseName?: string,
    pageId?: string,
  ) => {
    const connection = await getConnectionByTypes(
      connectionId,
      [EConnectionType.MONGODB],
      'MongoDB',
    );
    const client = await mongodb.getInstance(
      createPoolConfig(connection, {
        pageId,
      }),
    );
    return databaseName ? client.useDb(databaseName) : client;
  };
  const changeMongoDatabase = async (
    databaseName: string,
    connectionId: number,
    pageId?: string,
  ) => {
    const connection = await getConnectionByTypes(
      connectionId,
      [EConnectionType.MONGODB],
      'MongoDB',
    );
    const config = createPoolConfig(connection, { pageId });
    const previousClient = await mongodb.getInstance(config);
    mongodb.changeInstance(config, previousClient.useDb(databaseName));
  };

  return {
    req,
    res,
    user: { id: uid },
    db,
    pool: {
      getMysqlInstance,
      getPgsqlInstance,
      getRedisInstance,
      getMongoDbInstance,
      changeMongoDatabase,
      // backward compatibility: keep legacy typo method names until all callers are migrated.
      getRedislInstance: getRedisInstance,
      getMongoDBlInstance: getMongoDbInstance,
      changeMongoDB: changeMongoDatabase,
    },
  };
};

export default createContext;
