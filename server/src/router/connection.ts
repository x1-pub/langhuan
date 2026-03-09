import { and, eq, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

import { protectedProcedure, router } from '../trpc';
import { connectionsTable } from '../schema';
import redis from '../pools/redis';
import mysql from '../pools/mysql';
import mongodb from '../pools/mongodb';
import pgsql from '../pools/pgsql';
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
import { formatPgsqlCommandResult } from '../lib/pgsql-query-formatter';

const pgsqlShellDatabaseMap = new Map<string, string>();

const normalizeOptionalPassword = (value: string | null | undefined) => {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? value : undefined;
};

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
    const updatePayload: Partial<typeof connectionsTable.$inferInsert> = {
      name: input.name,
      host: input.host,
      port: input.port,
      username: input.username,
      database: input.database,
    };
    const normalizedPassword = normalizeOptionalPassword(input.password);

    if (normalizedPassword !== undefined) {
      updatePayload.password = normalizedPassword;
    }

    await ctx.db
      .update(connectionsTable)
      .set(updatePayload)
      .where(
        and(
          eq(connectionsTable.id, input.id),
          eq(connectionsTable.creator, ctx.user.id),
          isNull(connectionsTable.deletedAt),
        ),
      );
    return null;
  }),

  ping: protectedProcedure.input(PingConnectionSchema).mutation(async ({ ctx, input }) => {
    const uid = ctx.user.id;
    const { id, type, host, port, username, database, password } = input;
    const normalizedInputPassword = normalizeOptionalPassword(password);
    const dbConfig: IConnectionPoolConfig = {
      host,
      port,
      username,
      database,
      password: normalizedInputPassword === null ? null : normalizedInputPassword,
      uid,
    };

    if (id) {
      const data = await ctx.db.query.connectionsTable.findFirst({
        where: table => and(eq(table.creator, uid), eq(table.id, id), isNull(table.deletedAt)),
      });
      if (!data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `The accessed connection (ID: ${id}) does not exist or permission is denied.`,
        });
      }

      if (normalizedInputPassword === undefined) {
        dbConfig.password = data.password;
      }
    }

    if (type === EConnectionType.MYSQL || type === EConnectionType.MARIADB) {
      await mysql.getInstance(dbConfig);
    }

    if (type === EConnectionType.REDIS) {
      await redis.getInstance(dbConfig);
    }

    if (type === EConnectionType.MONGODB) {
      await mongodb.getInstance({ ...dbConfig, database });
    }

    if (type === EConnectionType.PGSQL) {
      await pgsql.getInstance({ ...dbConfig, database: database || 'postgres' });
    }
  }),

  executeCommand: protectedProcedure
    .input(ExecuteCommandSchema)
    .mutation(async ({ ctx, input }) => {
      const { type, connectionId, command, pageId } = input;
      const trimmedCommand = command.trim();

      if (!trimmedCommand) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Command cannot be empty.',
        });
      }

      switch (type) {
        case EConnectionType.REDIS: {
          const instance = await ctx.pool.getRedisInstance(connectionId, undefined, pageId);
          const parts = parseRedisCommand(trimmedCommand);
          const [cmd, ...args] = parts;

          const res = await instance.call(cmd, ...args);
          const result = formatRedisResult(res);

          return {
            result,
            changeDatabase: cmd.toLowerCase() === 'select' ? `[db${args[0]}]` : undefined,
          };
        }
        case EConnectionType.MYSQL:
        case EConnectionType.MARIADB: {
          const instance = await ctx.pool.getMysqlInstance(connectionId, undefined, pageId);
          const [results, metadata] = await instance.query(trimmedCommand);
          const type = getStatementType(trimmedCommand);

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
          const instance = await ctx.pool.getMongoDbInstance(connectionId, undefined, pageId);

          const parser = new MongoShellParser(instance);
          const { result: rawResult, changeDatabase } = await parser.executeCommand(trimmedCommand);
          const result = formatMongoResult(rawResult);

          if (changeDatabase) {
            await ctx.pool.changeMongoDatabase(changeDatabase, connectionId, pageId);
          }

          return {
            result,
            changeDatabase,
          };
        }
        case EConnectionType.PGSQL: {
          const sessionKey = `${ctx.user.id}:${connectionId}:${pageId}`;
          const switchDatabaseMatch = trimmedCommand.match(/^\\c\s+("?)([\w$]+)\1$/i);

          if (switchDatabaseMatch) {
            const targetDatabase = switchDatabaseMatch[2];
            await ctx.pool.getPgsqlInstance(connectionId, targetDatabase, pageId);
            pgsqlShellDatabaseMap.set(sessionKey, targetDatabase);
            return {
              result: `You are now connected to database "${targetDatabase}"`,
              changeDatabase: targetDatabase,
            };
          }

          const currentDatabase = pgsqlShellDatabaseMap.get(sessionKey);
          const instance = await ctx.pool.getPgsqlInstance(connectionId, currentDatabase, pageId);
          const result = await instance.query(trimmedCommand);

          return {
            result: formatPgsqlCommandResult(result),
            changeDatabase: undefined,
          };
        }
        default:
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Unsupported connection type: ${type}`,
          });
      }
    }),
});

export default connectionRouter;
