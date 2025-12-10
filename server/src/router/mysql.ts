import { QueryTypes } from 'sequelize';

import { protectedProcedure, router } from '../trpc';
import {
  AddColumnSchema,
  AddTableIndexSchema,
  AddTriggerSchema,
  BatchDeleteDataSchema,
  BatchInsertDataSchema,
  BatchUpdateDataSchema,
  DeleteColumnSchema,
  DeleteTableIndexSchema,
  DeleteTriggerSchema,
  ExportDataSchema,
  GeTMySQLProcessedDatasSchema,
  MySQLBaseSchema,
  SortMysqlColumnSchema,
  UpdateColumnSchema,
  UpdateTableIndexSchema,
  UpdateTriggerSchema,
} from '@packages/zod/mysql';
import {
  EMySQLDataExportType,
  IMySQLTableIndex,
  TMySQLTrigger,
  type IMySQLColumn,
} from '@packages/types/mysql';
import { escapedMySQLName } from '../lib/utils';
import { TMySQLRawData } from '@packages/types/mysql';
import { generateExcel, generateJSON, generateSQL } from '../lib/mysql-export-parser';
import { mysqlAPIs } from '../api/mysql';
import { sortMysqlDdlFields } from '../lib/mysql-ddl-field-sorter';
import {
  generateMySQLAddColumnSQL,
  generateMySQLAddTriggerSQL,
  generateMySQLUpdateColumnSQL,
  generateMysqlValuesClause,
  generateMysqlWhereClause,
} from '../lib/mysql-sql-generator';

const exportMysqlFileSuffixMap: Record<EMySQLDataExportType, string> = {
  [EMySQLDataExportType.SQL]: 'sql',
  [EMySQLDataExportType.JSON]: 'json',
  [EMySQLDataExportType.EXCEL]: 'xlsx',
};

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

export const mysqlRouter = router({
  getTableData: protectedProcedure
    .input(GeTMySQLProcessedDatasSchema)
    .query(async ({ ctx, input }) => {
      const { connectionId, dbName, tableName, current, pageSize, whereClause } = input;
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

      const escapedTableName = escapedMySQLName(tableName, instance);

      const [list, [count], columns] = await Promise.all([
        instance.query(
          `SELECT * FROM ${escapedTableName} ${whereClause} LIMIT ${(current - 1) * pageSize}, ${pageSize}`,
          { type: QueryTypes.SELECT },
        ),
        instance.query(`SELECT COUNT(*) as nums FROM ${escapedTableName} ${whereClause}`, {
          type: QueryTypes.SELECT,
        }),
        instance.query(`SHOW FULL COLUMNS FROM ${escapedTableName}`, { type: QueryTypes.SELECT }),
      ]);

      return {
        list: list as Record<string, TMySQLRawData>[],
        count: (count as { nums: number }).nums || list.length,
        columns: columns as IMySQLColumn[],
      };
    }),

  batchDeleteData: protectedProcedure
    .input(BatchDeleteDataSchema)
    .mutation(async ({ ctx, input }) => {
      const { connectionId, dbName, tableName, condition } = input;
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

      const escapedTableName = escapedMySQLName(tableName, instance);
      const { where, replacements } = generateMysqlWhereClause(condition, instance);
      const sql = `DELETE FROM ${escapedTableName} WHERE ${where} LIMIT ${condition.length}`;

      const result = await instance.query(sql, { replacements });

      return (result[1] as { affectedRows: number })?.affectedRows;
    }),

  batchUpdateData: protectedProcedure
    .input(BatchUpdateDataSchema)
    .mutation(async ({ ctx, input }) => {
      const { connectionId, dbName, tableName, condition, data } = input;
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

      const escapedTableName = escapedMySQLName(tableName, instance);

      const { where, replacements: whereReplacements } = generateMysqlWhereClause(
        condition,
        instance,
      );
      const { set, replacements: valuesReplacements } = generateMysqlValuesClause(data, instance);

      const sql = `UPDATE ${escapedTableName} SET ${set} WHERE ${where} LIMIT ${condition.length}`;
      const result = await instance.query(sql, {
        replacements: { ...whereReplacements, ...valuesReplacements },
        type: QueryTypes.UPDATE,
      });

      return result[1];
    }),

  batchInsertData: protectedProcedure
    .input(BatchInsertDataSchema)
    .mutation(async ({ ctx, input }) => {
      const { connectionId, dbName, tableName, data } = input;
      const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

      const escapedTableName = escapedMySQLName(tableName, instance);
      const { columns, values, replacements } = generateMysqlValuesClause(data, instance);
      const sql = `INSERT INTO ${escapedTableName} (${columns.join(', ')}) VALUES (${values.join(', ')})`;

      const result = await instance.query(sql, { replacements, type: QueryTypes.INSERT });

      return result[1];
    }),

  exportData: protectedProcedure.input(ExportDataSchema).mutation(async ({ ctx, input }) => {
    const { connectionId, dbName, tableName, condition, fields, type } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const escapedTableName = escapedMySQLName(tableName, instance);
    const columns: IMySQLColumn[] = await instance.query(
      `SHOW FULL COLUMNS FROM ${escapedTableName}`,
      { type: QueryTypes.SELECT },
    );

    const { where, replacements } = generateMysqlWhereClause(condition, instance);
    const sql = `SELECT ${fields.map(field => escapedMySQLName(field, instance))} FROM ${escapedTableName} WHERE ${where} LIMIT ${condition.length}`;
    const records: Record<string, TMySQLRawData>[] = await instance.query(sql, {
      replacements,
      type: QueryTypes.SELECT,
      raw: true,
    });

    const file =
      type === EMySQLDataExportType.EXCEL
        ? generateExcel({ tableName, columns, records, fields, sequelize: instance })
        : type === EMySQLDataExportType.JSON
          ? Buffer.from(
              JSON.stringify(
                generateJSON({ tableName, columns, records, fields, sequelize: instance }),
              ),
            )
          : type === EMySQLDataExportType.SQL
            ? Buffer.from(generateSQL({ tableName, columns, records, fields, sequelize: instance }))
            : Buffer.from('Error Export Type');

    return {
      file,
      filename: `${encodeURIComponent(tableName)}.${exportMysqlFileSuffixMap[type] || 'txt'}`,
    };
  }),

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

  getTableColumns: protectedProcedure.input(MySQLBaseSchema).query(async ({ ctx, input }) => {
    const { connectionId, dbName, tableName } = input;
    const instance = await ctx.pool.getMysqlInstance(connectionId, dbName);

    const escapedTableName = escapedMySQLName(tableName, instance);
    const result = await instance.query(`SHOW FULL COLUMNS FROM ${escapedTableName}`, {
      type: QueryTypes.SELECT,
    });

    return result as IMySQLColumn[];
  }),

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

export default mysqlRouter;
