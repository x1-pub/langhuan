import { EConnectionType } from '@packages/types/connection';
import { protectedProcedure, router } from '../trpc';
import {
  BaseDatabaseSchema,
  CreateOrUpdateDatabaseSchema,
  DeleteDatabaseSchema,
} from '@packages/zod/database';

interface IDatabaseItem {
  name: string;
  charset?: string;
  collation?: string;
}

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

    if (type === EConnectionType.MYSQL) {
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
  }),

  create: protectedProcedure
    .input(CreateOrUpdateDatabaseSchema)
    .mutation(async ({ ctx, input }) => {
      const { type, connectionId, dbName, charset, collation } = input;

      if (type === EConnectionType.MYSQL) {
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

      return null;
    }),

  update: protectedProcedure
    .input(CreateOrUpdateDatabaseSchema)
    .mutation(async ({ ctx, input }) => {
      const { type, connectionId, dbName, charset, collation } = input;

      if (type === EConnectionType.MYSQL) {
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

      return null;
    }),

  delete: protectedProcedure.input(DeleteDatabaseSchema).mutation(async ({ ctx, input }) => {
    const { type, connectionId, dbName } = input;

    if (type === EConnectionType.MYSQL) {
      const instance = await ctx.pool.getMysqlInstance(connectionId);
      const escapedDbName = instance.getQueryInterface().quoteIdentifier(dbName);
      await instance.query(`DROP DATABASE ${escapedDbName}`);
    }

    return null;
  }),
});

export default databaseRouter;
