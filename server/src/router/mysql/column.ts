import { QueryTypes } from 'sequelize';

import {
  AddColumnSchema,
  DeleteColumnSchema,
  MySQLBaseSchema,
  SortMysqlColumnSchema,
  UpdateColumnSchema,
} from '@packages/zod/mysql';
import { protectedProcedure, router } from '../../trpc';
import { escapedMySQLName } from '../../lib/utils';
import {
  generateMySQLAddColumnSQL,
  generateMySQLUpdateColumnSQL,
} from '../../lib/mysql-sql-generator';
import { sortMysqlDdlFields } from '../../lib/mysql-ddl-field-sorter';
import { IMySQLColumn } from '@packages/types/mysql';

const mysqlColumnRouter = router({
  getTableColumns: protectedProcedure.input(MySQLBaseSchema).query(async ({ ctx, input }) => {
    const { connectionId, dbName, tableName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const escapedTableName = escapedMySQLName(tableName, instance);
    const result = await instance.query(`SHOW FULL COLUMNS FROM ${escapedTableName}`, {
      type: QueryTypes.SELECT,
    });

    return result as IMySQLColumn[];
  }),

  sortMysqlColumn: protectedProcedure
    .input(SortMysqlColumnSchema)
    .mutation(async ({ ctx, input }) => {
      const { connectionId, dbName, tableName, fields } = input;
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

      const escapedTableName = escapedMySQLName(tableName, instance);
      const sql = `SHOW CREATE TABLE ${escapedTableName}`;
      const ddlResult = await instance.query(sql, { type: QueryTypes.SHOWTABLES });
      const ddl = ddlResult[1];

      const orderSql = sortMysqlDdlFields(ddl, tableName, fields);
      await instance.query(orderSql);

      return null;
    }),

  deleteColumn: protectedProcedure.input(DeleteColumnSchema).mutation(async ({ ctx, input }) => {
    const { connectionId, dbName, tableName, name } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const escapedColumnName = escapedMySQLName(name, instance);
    const escapedTableName = escapedMySQLName(tableName, instance);
    const sql = `ALTER TABLE ${escapedTableName} DROP COLUMN ${escapedColumnName};`;
    await instance.query(sql);

    return null;
  }),

  addColumn: protectedProcedure.input(AddColumnSchema).mutation(async ({ ctx, input }) => {
    const { connectionId, dbName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const sql = generateMySQLAddColumnSQL(input, instance);
    await instance.query(sql);

    return null;
  }),

  updateColumn: protectedProcedure.input(UpdateColumnSchema).mutation(async ({ ctx, input }) => {
    const { connectionId, dbName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const sql = generateMySQLUpdateColumnSQL(input, instance);
    await instance.query(sql);

    return null;
  }),
});

export default mysqlColumnRouter;
