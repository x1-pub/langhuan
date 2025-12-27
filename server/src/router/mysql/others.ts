import { QueryTypes } from 'sequelize';

import { protectedProcedure, router } from '../../trpc';
import { MySQLBaseSchema } from '@packages/zod/mysql';
import { escapedMySQLName } from '../../lib/utils';

interface ITableStatus {
  TABLE_CATALOG: string;
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
  TABLE_TYPE: string;
  ENGINE: string;
  ROW_FORMAT: string;
  CREATE_TIME: string;
  UPDATE_TIME: string;
  CHECK_TIME: string;
  TABLE_COLLATION: string;
  CREATE_OPTIONS: string;
  TABLE_COMMENT: string;
  VERSION: number;
  TABLE_ROWS: number;
  AVG_ROW_LENGTH: number;
  DATA_LENGTH: number;
  MAX_DATA_LENGTH: number;
  INDEX_LENGTH: number;
  DATA_FREE: number;
  AUTO_INCREMENT: number;
  CHECKSUM: number;
}

export const mysqlOthersRouter = router({
  getTableDDL: protectedProcedure.input(MySQLBaseSchema).query(async ({ ctx, input }) => {
    const { connectionId, dbName, tableName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const escapedTableName = escapedMySQLName(tableName, instance);
    const sql = `SHOW CREATE TABLE ${escapedTableName}`;
    const result = await instance.query(sql, { type: QueryTypes.SHOWTABLES });

    return result[1];
  }),

  getTableStatus: protectedProcedure.input(MySQLBaseSchema).query(async ({ ctx, input }) => {
    const { connectionId, dbName, tableName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const escapedTableName = instance.escape(tableName);
    const escapedDbName = instance.escape(dbName);
    const sql = `SELECT * FROM information_schema.TABLES WHERE TABLE_SCHEMA = ${escapedDbName} AND TABLE_NAME = ${escapedTableName}`;
    const result = await instance.query(sql, { type: QueryTypes.SELECT });

    return result[0] as ITableStatus;
  }),
});

export default mysqlOthersRouter;
