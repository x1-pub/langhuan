import { QueryTypes } from 'sequelize';

import {
  AddPartitionSchema,
  DeletePartitionSchema,
  GetPartitionsSchema,
  UpdatePartitionSchema,
} from '@packages/zod/mysql';
import { IMySQLPartition } from '@packages/types/mysql';
import { protectedProcedure, router } from '../../trpc';
import { escapedMySQLName } from '../../lib/utils';

const mysqlPartitionsRouter = router({
  getPartitions: protectedProcedure.input(GetPartitionsSchema).query(async ({ ctx, input }) => {
    const { connectionId, dbName, tableName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const partitions: IMySQLPartition[] = await instance.query(
      `
      SELECT
        PARTITION_NAME   AS name,
        PARTITION_METHOD AS method,
        PARTITION_EXPRESSION AS expression,
        PARTITION_DESCRIPTION AS description,
        TABLE_ROWS AS tableRows,
        DATA_LENGTH AS dataLength,
        INDEX_LENGTH AS indexLength,
        PARTITION_COMMENT AS comment,
        CREATE_TIME AS createTime,
        UPDATE_TIME AS updateTime
      FROM information_schema.PARTITIONS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY PARTITION_ORDINAL_POSITION;
    `,
      {
        replacements: [dbName, tableName],
        type: QueryTypes.SELECT,
      },
    );

    return partitions;
  }),

  addPartition: protectedProcedure.input(AddPartitionSchema).mutation(async ({ ctx, input }) => {
    const { connectionId, dbName, tableName, definition } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const escapedTableName = escapedMySQLName(tableName, instance);
    const sql = `ALTER TABLE ${escapedTableName} ADD PARTITION ( ${definition} );`;
    await instance.query(sql);
    return null;
  }),

  deletePartition: protectedProcedure
    .input(DeletePartitionSchema)
    .mutation(async ({ ctx, input }) => {
      const { connectionId, dbName, tableName, name } = input;
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

      const escapedTableName = escapedMySQLName(tableName, instance);
      const escapedName = escapedMySQLName(name, instance);
      const sql = `ALTER TABLE ${escapedTableName} DROP PARTITION ${escapedName};`;
      await instance.query(sql);
      return null;
    }),

  updatePartition: protectedProcedure
    .input(UpdatePartitionSchema)
    .mutation(async ({ ctx, input }) => {
      const { connectionId, dbName, tableName, definition, oldName } = input;
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

      const escapedTableName = escapedMySQLName(tableName, instance);
      const escapedOldName = escapedMySQLName(oldName, instance);

      const dropSQL = `ALTER TABLE ${escapedTableName} DROP PARTITION ${escapedOldName};`;
      const addSQL = `ALTER TABLE ${escapedTableName} ADD PARTITION ( ${definition} );`;
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

export default mysqlPartitionsRouter;
