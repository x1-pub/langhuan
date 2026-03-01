import { TRPCError } from '@trpc/server';

import { EConnectionType } from '@packages/types/connection';
import { protectedProcedure, router } from '../trpc';
import {
  BaseTableSchema,
  CreateTableSchema,
  DeleteTableSchema,
  UpdateTableSchema,
} from '@packages/zod/table';
import { MONGODB_PLACEHOLDER_COLLECTION } from '../lib/mongodb';
import { parsePgsqlQualifiedTableName, quotePgsqlIdentifier } from '../lib/pgsql';

interface ITableItem {
  name: string;
  comment?: string;
}

const isMysqlCompatible = (type: EConnectionType) =>
  type === EConnectionType.MYSQL || type === EConnectionType.MARIADB;

export const tableRouter = router({
  getList: protectedProcedure.input(BaseTableSchema).mutation(async ({ ctx, input }) => {
    const { type, connectionId, dbName } = input;

    if (isMysqlCompatible(type)) {
      const sql = `
          SELECT 
            TABLE_NAME as name, 
            TABLE_COMMENT as comment
          FROM 
            information_schema.TABLES
          WHERE 
            TABLE_SCHEMA = DATABASE();
        `;
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);
      const [tableList] = await instance.query(sql);

      return tableList as ITableItem[];
    }

    if (type === EConnectionType.MONGODB) {
      const instance = await ctx.pool.getMongoDBlInstance(connectionId, dbName);
      const res = await instance.listCollections();

      return res
        .filter(collection => collection.name !== MONGODB_PLACEHOLDER_COLLECTION)
        .map(db => ({ name: db.name })) as ITableItem[];
    }

    if (type === EConnectionType.PGSQL) {
      const instance = await ctx.pool.getPgsqlInstance(connectionId, dbName);
      const { rows } = await instance.query<ITableItem>(`
        SELECT
          table_schema || '.' || table_name AS name,
          COALESCE(
            obj_description(
              (quote_ident(table_schema) || '.' || quote_ident(table_name))::regclass,
              'pg_class'
            ),
            ''
          ) AS comment
        FROM information_schema.tables
        WHERE table_type = 'BASE TABLE'
          AND table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY table_schema, table_name
      `);

      return rows;
    }

    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        'Only MySQL, MariaDB, MongoDB, and PostgreSQL are supported for table/collection list queries.',
    });
  }),

  create: protectedProcedure.input(CreateTableSchema).mutation(async ({ ctx, input }) => {
    const { type, connectionId, dbName, tableName, comment = '' } = input;

    if (isMysqlCompatible(type)) {
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);
      const escapedTableName = instance.getQueryInterface().quoteIdentifier(tableName);
      const escapedComment = instance.escape(comment);
      const sql = `
          CREATE TABLE ${escapedTableName} (
            id INT PRIMARY KEY AUTO_INCREMENT,
            demo_hobby VARCHAR(50) DEFAULT 'writing code',
            demo_gender ENUM('Male', 'Female') COMMENT 'gender/性别'
          ) COMMENT ${escapedComment}
        `;
      await instance.query(sql);
    }

    if (type === EConnectionType.MONGODB) {
      const instance = await ctx.pool.getMongoDBlInstance(connectionId, dbName);
      if (!instance.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'MongoDB connection is not ready.',
        });
      }
      await instance.db.createCollection(tableName);
    }

    if (type === EConnectionType.PGSQL) {
      const instance = await ctx.pool.getPgsqlInstance(connectionId, dbName);
      const parsed = parsePgsqlQualifiedTableName(tableName);
      const qualifiedTableName = `${parsed.quotedSchemaName}.${parsed.quotedTableName}`;

      await instance.query(`CREATE SCHEMA IF NOT EXISTS ${parsed.quotedSchemaName}`);
      await instance.query(`CREATE TABLE ${qualifiedTableName} (id BIGSERIAL PRIMARY KEY)`);
      if (comment) {
        await instance.query(`COMMENT ON TABLE ${qualifiedTableName} IS $1`, [comment]);
      }
    }

    if (type === EConnectionType.REDIS) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Redis does not support creating tables/collections.',
      });
    }

    return null;
  }),

  update: protectedProcedure.input(UpdateTableSchema).mutation(async ({ ctx, input }) => {
    const { type, connectionId, dbName, tableName, newTableName, comment = '' } = input;

    if (isMysqlCompatible(type)) {
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);
      const escapedTableName = instance.getQueryInterface().quoteIdentifier(tableName);
      const escapedNewTableName = instance.getQueryInterface().quoteIdentifier(newTableName);
      const escapedComment = instance.escape(comment);
      const sql = `ALTER TABLE ${escapedTableName} RENAME TO ${escapedNewTableName}, COMMENT = ${escapedComment}`;
      await instance.query(sql);
    }

    if (type === EConnectionType.MONGODB) {
      if (tableName === MONGODB_PLACEHOLDER_COLLECTION) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'The internal placeholder collection cannot be renamed.',
        });
      }
      const instance = await ctx.pool.getMongoDBlInstance(connectionId, dbName);
      if (!instance.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'MongoDB connection is not ready.',
        });
      }
      await instance.db.collection(tableName).rename(newTableName);
    }

    if (type === EConnectionType.PGSQL) {
      const instance = await ctx.pool.getPgsqlInstance(connectionId, dbName);
      const oldName = parsePgsqlQualifiedTableName(tableName);
      const newName = parsePgsqlQualifiedTableName(newTableName);
      let currentSchema = oldName.schemaName;
      const currentTable = oldName.tableName;

      if (oldName.schemaName !== newName.schemaName) {
        await instance.query(`CREATE SCHEMA IF NOT EXISTS ${newName.quotedSchemaName}`);
        await instance.query(
          `ALTER TABLE ${oldName.quotedSchemaName}.${oldName.quotedTableName} SET SCHEMA ${newName.quotedSchemaName}`,
        );
        currentSchema = newName.schemaName;
      }

      if (currentTable !== newName.tableName) {
        const currentQualifiedTableName = `${quotePgsqlIdentifier(currentSchema, 'schema')}.${quotePgsqlIdentifier(currentTable, 'table')}`;
        await instance.query(
          `ALTER TABLE ${currentQualifiedTableName} RENAME TO ${newName.quotedTableName}`,
        );
      }

      const nextQualifiedTableName = `${newName.quotedSchemaName}.${newName.quotedTableName}`;
      const normalizedComment = comment.trim();
      if (normalizedComment) {
        await instance.query(`COMMENT ON TABLE ${nextQualifiedTableName} IS $1`, [
          normalizedComment,
        ]);
      } else {
        await instance.query(`COMMENT ON TABLE ${nextQualifiedTableName} IS NULL`);
      }
    }

    if (type === EConnectionType.REDIS) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Redis does not support renaming tables/collections.',
      });
    }

    return null;
  }),

  delete: protectedProcedure.input(DeleteTableSchema).mutation(async ({ ctx, input }) => {
    const { type, connectionId, dbName, tableName } = input;

    if (isMysqlCompatible(type)) {
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);
      const escapedTableName = instance.getQueryInterface().quoteIdentifier(tableName);
      await instance.query(`DROP TABLE ${escapedTableName}`);
    }

    if (type === EConnectionType.MONGODB) {
      if (tableName === MONGODB_PLACEHOLDER_COLLECTION) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'The internal placeholder collection cannot be deleted.',
        });
      }
      const instance = await ctx.pool.getMongoDBlInstance(connectionId, dbName);
      if (!instance.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'MongoDB connection is not ready.',
        });
      }
      await instance.db.dropCollection(tableName);
    }

    if (type === EConnectionType.PGSQL) {
      const instance = await ctx.pool.getPgsqlInstance(connectionId, dbName);
      const parsed = parsePgsqlQualifiedTableName(tableName);
      await instance.query(
        `DROP TABLE IF EXISTS ${parsed.quotedSchemaName}.${parsed.quotedTableName}`,
      );
    }

    if (type === EConnectionType.REDIS) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Redis does not support dropping tables/collections.',
      });
    }

    return null;
  }),
});

export default tableRouter;
