import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { drizzle } from 'drizzle-orm/mysql2';
import dotenv from 'dotenv';
import path from 'path';

import mysql from './pools/mysql';
import redis from './pools/redis';
import mongodb from './pools/mongodb';
import * as schema from './schema';
import { TRPCError } from '@trpc/server';
import { EConnectionType } from '@packages/types/connection';

dotenv.config({ path: path.join(__dirname, `../.env.${process.env.NODE_ENV}`) });

const db = drizzle(process.env.DATABASE_URL, { schema, mode: 'default' });

const createContext = async ({ req, res }: CreateFastifyContextOptions) => {
  const uid = Number(req.headers['sso-uid-id']) || Number(process.env.DEV_USER_ID);

  return {
    req,
    res,
    user: { id: uid },
    db,
    pool: {
      getMysqlInstance: async (connectionId: number, dbName?: string, pageId?: string) => {
        const instance = await db.query.connectionsTable.findFirst({
          where: (table, { and, eq }) =>
            and(
              eq(table.creator, uid),
              eq(table.id, connectionId),
              eq(table.type, EConnectionType.MYSQL),
            ),
        });
        if (!instance) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return mysql.getInstance({
          uid,
          host: instance.host,
          port: instance.port,
          username: instance.username,
          password: instance.password,
          database: dbName,
          pageId,
        });
      },
      getRedislInstance: async (connectionId: number, dbName?: string, pageId?: string) => {
        const instance = await db.query.connectionsTable.findFirst({
          where: (table, { and, eq }) =>
            and(
              eq(table.creator, uid),
              eq(table.id, connectionId),
              eq(table.type, EConnectionType.REDIS),
            ),
        });
        if (!instance) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return redis.getInstance({
          uid,
          host: instance.host,
          port: instance.port,
          username: instance.username,
          password: instance.password,
          database: dbName,
          pageId,
        });
      },
      getMongoDBlInstance: async (connectionId: number, dbName?: string, pageId?: string) => {
        const instance = await db.query.connectionsTable.findFirst({
          where: (table, { and, eq }) =>
            and(
              eq(table.creator, uid),
              eq(table.id, connectionId),
              eq(table.type, EConnectionType.MONGODB),
            ),
        });
        if (!instance) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        const connection = await mongodb.getInstance({
          uid,
          host: instance.host,
          port: instance.port,
          username: instance.username,
          password: instance.password,
          database: instance.database,
          pageId,
        });
        return dbName ? connection.useDb(dbName) : connection;
      },
      changeMongoDB: async (
        newDbName: string,
        connectionId: number,
        _dbName?: string,
        pageId?: string,
      ) => {
        const instance = await db.query.connectionsTable.findFirst({
          where: (table, { and, eq }) =>
            and(
              eq(table.creator, uid),
              eq(table.id, connectionId),
              eq(table.type, EConnectionType.MONGODB),
            ),
        });
        if (!instance) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        const config = {
          uid,
          host: instance.host,
          port: instance.port,
          username: instance.username,
          password: instance.password,
          database: instance.database,
          pageId,
        };
        const oldConnection = await mongodb.getInstance(config);
        mongodb.changeInstance(config, oldConnection.useDb(newDbName));
      },
    },
  };
};

export default createContext;
