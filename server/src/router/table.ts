import { TRPCError } from '@trpc/server';

import { EConnectionType } from '@packages/types/connection';
import { protectedProcedure, router } from '../trpc';
import {
  BaseTableSchema,
  CreateTableSchema,
  DeleteTableSchema,
  UpdateTableSchema,
} from '@packages/zod/table';

interface ITableItem {
  name: string;
  comment?: string;
}

export const tableRouter = router({
  getList: protectedProcedure.input(BaseTableSchema).mutation(async ({ ctx, input }) => {
    const { type, connectionId, dbName } = input;

    if (type === EConnectionType.MYSQL) {
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

      return res.map(db => ({ name: db.name })) as ITableItem[];
    }

    throw new TRPCError({ code: 'BAD_REQUEST' });
  }),

  create: protectedProcedure.input(CreateTableSchema).mutation(async ({ ctx, input }) => {
    const { type, connectionId, dbName, tableName, comment = '' } = input;

    if (type === EConnectionType.MYSQL) {
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

    return null;
  }),

  update: protectedProcedure.input(UpdateTableSchema).mutation(async ({ ctx, input }) => {
    const { type, connectionId, dbName, tableName, newTableName, comment = '' } = input;

    if (type === EConnectionType.MYSQL) {
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);
      const escapedTableName = instance.getQueryInterface().quoteIdentifier(tableName);
      const escapedNewTableName = instance.getQueryInterface().quoteIdentifier(newTableName);
      const escapedComment = instance.escape(comment);
      const sql = `ALTER TABLE ${escapedTableName} RENAME TO ${escapedNewTableName}, COMMENT = ${escapedComment}`;
      await instance.query(sql);
    }

    return null;
  }),

  delete: protectedProcedure.input(DeleteTableSchema).mutation(async ({ ctx, input }) => {
    const { type, connectionId, dbName, tableName } = input;

    if (type === EConnectionType.MYSQL) {
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);
      const escapedTableName = instance.getQueryInterface().quoteIdentifier(tableName);
      await instance.query(`DROP TABLE ${escapedTableName}`);
    }

    return null;
  }),
});

export default tableRouter;
