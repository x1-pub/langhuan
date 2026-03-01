import { EConnectionType } from '@packages/types/connection';
import { protectedProcedure, router } from '../trpc';
import {
  BaseDatabaseSchema,
  CreateOrUpdateDatabaseSchema,
  DeleteDatabaseSchema,
} from '@packages/zod/database';
import { TRPCError } from '@trpc/server';
import { MONGODB_PLACEHOLDER_COLLECTION } from '../lib/mongodb';
import { quotePgsqlIdentifier } from '../lib/pgsql';

interface IDatabaseItem {
  name: string;
  charset?: string;
  collation?: string;
}

const isMysqlCompatible = (type: EConnectionType) =>
  type === EConnectionType.MYSQL || type === EConnectionType.MARIADB;

export const databaseRouter = router({
  getList: protectedProcedure.input(BaseDatabaseSchema).query(async ({ ctx, input }) => {
    const { type, connectionId } = input;

    if (type === EConnectionType.REDIS) {
      const instance = await ctx.pool.getRedislInstance(connectionId);
      const [, dbCount] = (await instance.config('GET', 'databases')) as string[];
      const dbList = Array.from({ length: Number(dbCount) }, (_, i) => ({
        name: String(i),
      })) as IDatabaseItem[];

      return dbList;
    }

    if (isMysqlCompatible(type)) {
      const sql = `
          SELECT 
            SCHEMA_NAME as name , 
            DEFAULT_CHARACTER_SET_NAME as charset,
            DEFAULT_COLLATION_NAME as collation
          FROM 
            information_schema.SCHEMATA;
        `;
      const instance = await ctx.pool.getMysqlInstance(connectionId);
      const [dbList] = await instance.query(sql);

      return dbList as IDatabaseItem[];
    }

    if (type === EConnectionType.MONGODB) {
      const instance = await ctx.pool.getMongoDBlInstance(connectionId);
      const res = await instance.listDatabases();
      const dbList = res.databases.map(db => ({ name: db.name })) as IDatabaseItem[];

      return dbList;
    }

    if (type === EConnectionType.PGSQL) {
      const instance = await ctx.pool.getPgsqlInstance(connectionId);
      const { rows } = await instance.query<Required<IDatabaseItem>>(`
        SELECT
          datname AS name,
          pg_encoding_to_char(encoding) AS charset,
          datcollate AS collation
        FROM pg_database
        WHERE datistemplate = FALSE
        ORDER BY datname
      `);

      return rows;
    }

    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Unsupported connection type for database listing: ${type}`,
    });
  }),

  create: protectedProcedure
    .input(CreateOrUpdateDatabaseSchema)
    .mutation(async ({ ctx, input }) => {
      const { type, connectionId, dbName, charset, collation } = input;

      if (isMysqlCompatible(type)) {
        const instance = await ctx.pool.getMysqlInstance(connectionId);
        const escapedDbName = instance.getQueryInterface().quoteIdentifier(dbName);
        const sqlArray = [`CREATE DATABASE ${escapedDbName}`];
        if (charset) {
          sqlArray.push(`CHARACTER SET ${charset}`);
        }
        if (collation) {
          sqlArray.push(`COLLATE ${collation}`);
        }
        await instance.query(sqlArray.join(' '));
      }

      if (type === EConnectionType.MONGODB) {
        const instance = await ctx.pool.getMongoDBlInstance(connectionId, dbName);
        if (!instance.db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'MongoDB connection is not ready.',
          });
        }
        const exists = await instance.db
          .listCollections({ name: MONGODB_PLACEHOLDER_COLLECTION })
          .toArray();
        if (exists.length === 0) {
          await instance.db.createCollection(MONGODB_PLACEHOLDER_COLLECTION);
        }
      }

      if (type === EConnectionType.PGSQL) {
        const instance = await ctx.pool.getPgsqlInstance(connectionId);
        const escapedDbName = quotePgsqlIdentifier(dbName, 'database');
        const options: string[] = [];

        if (charset) {
          options.push(`ENCODING '${charset.replace(/'/g, "''")}'`);
        }

        if (collation) {
          const escapedCollation = collation.replace(/'/g, "''");
          options.push(`LC_COLLATE '${escapedCollation}'`);
          options.push(`LC_CTYPE '${escapedCollation}'`);
        }

        const sql = `CREATE DATABASE ${escapedDbName}${options.length ? ` WITH ${options.join(' ')}` : ''}`;
        await instance.query(sql);
      }

      if (type === EConnectionType.REDIS) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Redis does not support creating databases from this editor.',
        });
      }

      return null;
    }),

  update: protectedProcedure
    .input(CreateOrUpdateDatabaseSchema)
    .mutation(async ({ ctx, input }) => {
      const { type, connectionId, dbName, charset, collation } = input;

      if (isMysqlCompatible(type)) {
        const instance = await ctx.pool.getMysqlInstance(connectionId);
        const escapedDbName = instance.getQueryInterface().quoteIdentifier(dbName);
        const sqlArray = [`ALTER DATABASE ${escapedDbName}`];
        if (charset) {
          sqlArray.push(`CHARACTER SET ${charset}`);
        }
        if (collation) {
          sqlArray.push(`COLLATE ${collation}`);
        }
        await instance.query(sqlArray.join(' '));
      }

      if (type === EConnectionType.MONGODB) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'MongoDB does not support renaming a database.',
        });
      }

      if (type === EConnectionType.PGSQL) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'PostgreSQL database update is not supported in this editor.',
        });
      }

      if (type === EConnectionType.REDIS) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Redis does not support renaming databases from this editor.',
        });
      }

      return null;
    }),

  delete: protectedProcedure.input(DeleteDatabaseSchema).mutation(async ({ ctx, input }) => {
    const { type, connectionId, dbName } = input;

    if (isMysqlCompatible(type)) {
      const instance = await ctx.pool.getMysqlInstance(connectionId);
      const escapedDbName = instance.getQueryInterface().quoteIdentifier(dbName);
      await instance.query(`DROP DATABASE ${escapedDbName}`);
    }

    if (type === EConnectionType.MONGODB) {
      const instance = await ctx.pool.getMongoDBlInstance(connectionId, dbName);
      if (!instance.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'MongoDB connection is not ready.',
        });
      }
      await instance.db.dropDatabase();
    }

    if (type === EConnectionType.PGSQL) {
      const instance = await ctx.pool.getPgsqlInstance(connectionId);
      const escapedDbName = quotePgsqlIdentifier(dbName, 'database');
      await instance.query(`DROP DATABASE ${escapedDbName}`);
    }

    if (type === EConnectionType.REDIS) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Redis does not support dropping databases from this editor.',
      });
    }

    return null;
  }),
});

export default databaseRouter;
