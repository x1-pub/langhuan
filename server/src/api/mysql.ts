import z from 'zod';
import { Sequelize } from 'sequelize';

import { AddTableIndexSchema, DeleteTableIndexSchema } from '@packages/zod/mysql';
import { escapedMySQLName } from '../lib/utils';

export const mysqlAPIs = {
  addIndex: async (instance: Sequelize, input: z.infer<typeof AddTableIndexSchema>) => {
    const { tableName, type, name, comment, fields } = input;

    const escapedTableName = escapedMySQLName(tableName, instance);
    const escapedName = name ? escapedMySQLName(name, instance) : '';
    const commentClause = comment ? 'COMMENT :comment' : '';
    const fieldsClause = fields
      .map(field => {
        let name = escapedMySQLName(field.name, instance);
        if (field.len) {
          name += `(${field.len})`;
        }
        if (field.order) {
          name += ` ${field.order}`;
        }
        return name;
      })
      .join(', ');

    const sql = `ALTER TABLE ${escapedTableName} ADD ${type} ${escapedName} (${fieldsClause}) ${commentClause}`;
    await instance.query(sql, { replacements: { comment } });
  },

  deleteIndex: async (instance: Sequelize, input: z.infer<typeof DeleteTableIndexSchema>) => {
    const { tableName, name } = input;
    const escapedTableName = escapedMySQLName(tableName, instance);
    const escapedName = escapedMySQLName(name, instance);

    const deleteIndexsql = `ALTER TABLE ${escapedTableName} DROP INDEX ${escapedName}`;
    await instance.query(deleteIndexsql);
  },
};
