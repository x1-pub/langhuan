import { and, eq, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

import { protectedProcedure, router } from '../trpc';
import { connectionsTable } from '../schema';
import redis from '../pools/redis';
import mysql from '../pools/mysql';
import mongoodb from '../pools/mongodb';
import {
  CreateConnectionSchema,
  ConnectionIdZod,
  UpdateConnectionSchema,
  PingConnectionSchema,
  ExecuteCommandSchema,
} from '@packages/zod/connection';
import { EConnectionType, IConnectionPoolConfig } from '@packages/types/connection';
import { parseRedisCommand } from '../lib/redis-shell-parser';
import { formatRedisResult } from '../lib/redis-result-formatter';
import {
  formatNonQueryResult,
  formatQueryResult,
  getMysqlDBNameFromMetadata,
  getStatementType,
} from '../lib/mysql-query-formatter';
import { MongoShellParser } from '../lib/mongo-shell-parser';
import { formatMongoResult } from '../lib/mongo-result-formatter';

export const connectionRouter = router({
  getList: protectedProcedure.query(async ({ ctx }) => {
    const list = await ctx.db.query.connectionsTable.findMany({
      where: table => and(eq(table.creator, ctx.user.id), isNull(table.deletedAt)),
      columns: {
        id: true,
        type: true,
        name: true,
      },
    });

    return list;
  }),

  create: protectedProcedure.input(CreateConnectionSchema).mutation(async ({ ctx, input }) => {
    const now = new Date();
    await ctx.db
      .insert(connectionsTable)
      .values({ ...input, createdAt: now, updatedAt: now, creator: ctx.user.id });

    return null;
  }),

  getDetailById: protectedProcedure.input(ConnectionIdZod).query(async ({ input, ctx }) => {
    const data = await ctx.db.query.connectionsTable.findFirst({
      where: table =>
        and(eq(table.creator, ctx.user.id), eq(table.id, input.id), isNull(table.deletedAt)),
    });

    if (!data) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `The accessed connection (ID: ${input.id}) does not exist or permission is denied.`,
      });
    }

    return { ...data, password: data?.password ? '*'.repeat(10) : null };
  }),

  deleteById: protectedProcedure.input(ConnectionIdZod).mutation(async ({ input, ctx }) => {
    await ctx.db
      .update(connectionsTable)
      .set({ deletedAt: new Date() })
      .where(and(eq(connectionsTable.creator, ctx.user.id), eq(connectionsTable.id, input.id)));
    return null;
  }),

  update: protectedProcedure.input(UpdateConnectionSchema).mutation(async ({ ctx, input }) => {
    await ctx.db
      .update(connectionsTable)
      .set(input)
      .where(and(eq(connectionsTable.id, input.id), isNull(connectionsTable.deletedAt)));
    return null;
  }),

  ping: protectedProcedure.input(PingConnectionSchema).mutation(async ({ ctx, input }) => {
    const uid = ctx.user.id;
    const { id, type, host, port, username, database, password } = input;
    const dbConfig: IConnectionPoolConfig = { host, port, username, database, password, uid };

    if (id) {
      const data = await ctx.db.query.connectionsTable.findFirst({
        where: table => and(eq(table.creator, uid), eq(table.id, id), isNull(table.deletedAt)),
      });
      dbConfig.password = data?.password;
    }

    if (type === EConnectionType.MYSQL) {
      await mysql.getInstance(dbConfig);
    }

    if (type === EConnectionType.REDIS) {
      await redis.getInstance(dbConfig);
    }

    if (type === EConnectionType.MONGODB) {
      await mongoodb.getInstance({ ...dbConfig, database });
    }
  }),

  executeCommand: protectedProcedure
    .input(ExecuteCommandSchema)
    .mutation(async ({ ctx, input }) => {
      const { type, connectionId, command, pageId } = input;

      switch (type) {
        case EConnectionType.REDIS: {
          const instance = await ctx.pool.getRedislInstance(connectionId, undefined, pageId);
          const parts = parseRedisCommand(command);
          const [cmd, ...args] = parts;

          const res = await instance.call(cmd, ...args);
          const result = formatRedisResult(res);

          return {
            result,
            changeDatabase: cmd.toLowerCase() === 'select' ? `[db${args[0]}]` : undefined,
          };
        }
        case EConnectionType.MYSQL: {
          const instance = await ctx.pool.getMysqlInstance(connectionId, undefined, pageId);
          const [results, metadata] = await instance.query(command);
          const type = getStatementType(command);

          if (type === 'query') {
            return {
              result: formatQueryResult(results),
              changeDatabase: undefined,
            };
          }

          const db = getMysqlDBNameFromMetadata(metadata);
          return {
            result: formatNonQueryResult(type, metadata),
            changeDatabase: type === 'use' && db ? db : undefined,
          };
        }
        case EConnectionType.MONGODB: {
          const instance = await ctx.pool.getMongoDBlInstance(connectionId, undefined, pageId);

          const parser = new MongoShellParser(instance);
          const res = await parser.executeCommand(command);

          const result = formatMongoResult(res);
          const changeDatabase = result.match(/switched to db (.+)/)?.[1];

          if (changeDatabase) {
            await ctx.pool.changeMongoDB(changeDatabase, connectionId, pageId);
          }

          return {
            result,
            changeDatabase,
          };
        }
      }
    }),
});

export default connectionRouter;
