import { QueryTypes } from 'sequelize';

import {
  AddTriggerSchema,
  DeleteTriggerSchema,
  MySQLBaseSchema,
  UpdateTriggerSchema,
} from '@packages/zod/mysql';
import { protectedProcedure, router } from '../../trpc';
import { generateMySQLAddTriggerSQL } from '../../lib/mysql-sql-generator';
import { TMySQLTrigger } from '@packages/types/mysql';

const mysqlTriggersRouter = router({
  getTriggers: protectedProcedure.input(MySQLBaseSchema).query(async ({ ctx, input }) => {
    const { connectionId, dbName, tableName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const triggers: TMySQLTrigger[] = await instance.query(
      `
      SELECT 
        TRIGGER_NAME AS name,
        EVENT_MANIPULATION AS event,
        ACTION_TIMING AS timing,
        EVENT_OBJECT_TABLE AS tableName,
        ACTION_STATEMENT AS statement,
        CREATED AS created,
        SQL_MODE AS sqlMode,
        CHARACTER_SET_CLIENT AS characterSetClient,
        COLLATION_CONNECTION AS collationConnection
      FROM information_schema.TRIGGERS
      WHERE
        TRIGGER_SCHEMA = DATABASE()
        AND EVENT_OBJECT_TABLE = ?
    `,
      {
        replacements: [tableName],
        type: QueryTypes.SELECT,
      },
    );

    return triggers;
  }),

  addTrigger: protectedProcedure.input(AddTriggerSchema).mutation(async ({ ctx, input }) => {
    const { connectionId, dbName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const sql = generateMySQLAddTriggerSQL(input);
    await instance.query(sql);

    return null;
  }),

  deleteTrigger: protectedProcedure.input(DeleteTriggerSchema).mutation(async ({ ctx, input }) => {
    const { connectionId, dbName, name } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const sql = `DROP TRIGGER IF EXISTS ${name};`;
    await instance.query(sql);

    return null;
  }),

  updateTrigger: protectedProcedure.input(UpdateTriggerSchema).mutation(async ({ ctx, input }) => {
    const { connectionId, dbName, oldName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const dropSQL = `DROP TRIGGER IF EXISTS ${oldName};`;
    const addSQL = generateMySQLAddTriggerSQL(input);
    const transaction = await instance.transaction();
    try {
      await instance.query(dropSQL, { transaction });
      await instance.query(addSQL, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return null;
  }),
});

export default mysqlTriggersRouter;
