import { QueryTypes } from 'sequelize';

import {
  AddTableIndexSchema,
  DeleteTableIndexSchema,
  MySQLBaseSchema,
  UpdateTableIndexSchema,
} from '@packages/zod/mysql';
import { protectedProcedure, router } from '../../trpc';
import { escapedMySQLName } from '../../lib/utils';
import { IMySQLTableIndex } from '@packages/types/mysql';
import { mysqlAPIs } from '../../api/mysql';

const mysqlIndexesRouter = router({
  getTableIndex: protectedProcedure.input(MySQLBaseSchema).query(async ({ ctx, input }) => {
    const { connectionId, dbName, tableName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const escapedTableName = escapedMySQLName(tableName, instance);
    const sql = `SHOW INDEX FROM ${escapedTableName}`;
    const result = await instance.query(sql, { type: QueryTypes.SELECT });

    return result as IMySQLTableIndex[];
  }),

  addTableIndex: protectedProcedure.input(AddTableIndexSchema).mutation(async ({ ctx, input }) => {
    const { connectionId, dbName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);
    await mysqlAPIs.addIndex(instance, input);
    return null;
  }),

  deleteTableIndex: protectedProcedure
    .input(DeleteTableIndexSchema)
    .mutation(async ({ ctx, input }) => {
      const { connectionId, dbName } = input;
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);
      await mysqlAPIs.deleteIndex(instance, input);
      return null;
    }),

  updateTableIndex: protectedProcedure
    .input(UpdateTableIndexSchema)
    .mutation(async ({ ctx, input }) => {
      const { connectionId, dbName, oldName } = input;
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

      const transaction = await instance.transaction();
      try {
        await mysqlAPIs.deleteIndex(instance, { ...input, name: oldName });
        await mysqlAPIs.addIndex(instance, input);
        await transaction.commit();

        return null;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }),
});

export default mysqlIndexesRouter;
