import { QueryTypes } from 'sequelize';

import {
  BatchDeleteDataSchema,
  BatchInsertDataSchema,
  BatchUpdateDataSchema,
  ExportDataSchema,
  GeTMySQLProcessedDatasSchema,
} from '@packages/zod/mysql';
import { protectedProcedure, router } from '../../trpc';
import { escapedMySQLName } from '../../lib/utils';
import { EMySQLDataExportType, IMySQLColumn, TMySQLRawData } from '@packages/types/mysql';
import { generateExcel, generateJSON, generateSQL } from '../../lib/mysql-export-parser';
import { generateMysqlValuesClause, generateMysqlWhereClause } from '../../lib/mysql-sql-generator';

const exportMysqlFileSuffixMap: Record<EMySQLDataExportType, string> = {
  [EMySQLDataExportType.SQL]: 'sql',
  [EMySQLDataExportType.JSON]: 'json',
  [EMySQLDataExportType.EXCEL]: 'xlsx',
};

const mysqlDataRouter = router({
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
});

export default mysqlDataRouter;
