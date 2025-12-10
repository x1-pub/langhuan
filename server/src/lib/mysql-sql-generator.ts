import z from 'zod';
import { Sequelize } from 'sequelize';

import { AddColumnSchema, UpdateColumnSchema, AddTriggerSchema } from '@packages/zod/mysql';
import { TMySQLCondition } from '@packages/types/mysql';
import { escapedMySQLName } from './utils';

export const generateMysqlValuesClause = (data: TMySQLCondition[number], sequelize: Sequelize) => {
  const replacements: Record<string, string | number | Buffer<ArrayBuffer> | null> = {};
  const columns = Object.keys(data).map(k => escapedMySQLName(k, sequelize));
  const values: string[] = [];

  const set = Object.keys(data)
    .map((key, idx) => {
      const escapedColumnName = escapedMySQLName(key, sequelize);
      const valueName = `v_${idx}`;

      replacements[valueName] =
        typeof data[key] !== 'object' || data[key] === null
          ? data[key]
          : data[key].type === 'spatial' || data[key].type === 'json'
            ? data[key].value
            : data[key].type === 'buffer'
              ? Buffer.from(data[key].value)
              : data[key];

      const op = data[key] == null ? 'IS' : '=';

      const valueNameReplace =
        typeof data[key] === 'object' && data[key]?.type === 'spatial'
          ? `ST_GeomFromText(:${valueName})`
          : `:${valueName}`;

      values.push(valueNameReplace);

      return `${escapedColumnName} ${op} ${valueNameReplace}`;
    })
    .join(', ');

  return { values, replacements, columns, set };
};

export const generateMysqlWhereClause = (condition: TMySQLCondition, sequelize: Sequelize) => {
  const replacements: Record<string, string | number | Buffer<ArrayBuffer> | null> = {};

  const where = condition
    .map((con, pIdx) => {
      const oneRow = Object.keys(con)
        .map((k, cIdx) => {
          const escapedColumnName = escapedMySQLName(k, sequelize);
          const valueName = `w_${pIdx}_${cIdx}`;

          replacements[valueName] =
            typeof con[k] !== 'object' || con[k] === null
              ? con[k]
              : con[k].type === 'buffer'
                ? Buffer.from(con[k].value)
                : con[k].value;

          const op = con[k] == null ? 'IS' : '=';

          const valueNameReplace =
            typeof con[k] !== 'object' || con[k] === null
              ? `:${valueName}`
              : con[k].type === 'spatial'
                ? `ST_GeomFromText(:${valueName})`
                : con[k].type === 'json'
                  ? `CAST(:${valueName} AS JSON)`
                  : `:${valueName}`;

          return `${escapedColumnName} ${op} ${valueNameReplace}`;
        })
        .join(' AND ');

      return `(${oneRow})`;
    })
    .join(' OR ');

  return { where, replacements };
};

export const generateMySQLAddTriggerSQL = (input: z.infer<typeof AddTriggerSchema>): string => {
  const { name, event, timing, statement, tableName } = input;

  let sql = '';

  sql += `CREATE TRIGGER ${name}\n`;
  sql += `${timing} ${event} ON ${tableName}\n`;
  sql += 'FOR EACH ROW\n';
  sql += statement;

  return sql;
};

const generateMySQLBaseColumnInfoSQL = (
  input: z.infer<typeof AddColumnSchema>,
  sequelize: Sequelize,
) => {
  const {
    fieldType,
    fieldExtra,
    allowNull,
    defaultValue,
    defaultValueType,
    onUpdateCurrentTime,
    isPrimary,
    autoIncrement,
    unsigned,
    zerofill,
    charset,
    collation,
    comment,
  } = input;

  // 构建类型部分
  let typeStr = fieldType;
  if (fieldExtra) {
    typeStr += `(${fieldExtra})`;
  }

  const attributes: string[] = [];

  // 构建属性部分
  if (unsigned) {
    attributes.push('UNSIGNED');
  }
  if (zerofill) {
    attributes.push('ZEROFILL');
  }
  if (autoIncrement) {
    attributes.push('AUTO_INCREMENT');
  }

  // 处理字符集
  if (charset) {
    attributes.push(`CHARACTER SET ${charset}`);
  }
  if (collation) {
    attributes.push(`COLLATE ${collation}`);
  }

  // 处理空约束
  const nullConstraint = allowNull ? 'NULL' : 'NOT NULL';
  attributes.push(nullConstraint);

  // 处理默认值
  if (defaultValueType !== 'NONE') {
    const v = defaultValueType === 'EMPTY_STRING' ? "''" : sequelize.escape(defaultValue || '');
    attributes.push(`DEFAULT ${v}`);
  }

  // 处理主键
  if (isPrimary) {
    attributes.push('PRIMARY KEY');
  }

  if (onUpdateCurrentTime) {
    attributes.push('ON UPDATE CURRENT_TIMESTAMP');
  }

  // 处理注释
  if (comment) {
    const v = sequelize.escape(comment);
    attributes.push(`COMMENT ${v}`);
  }

  return `${typeStr} ${attributes.join(' ')}`;
};

export const generateMySQLAddColumnSQL = (
  input: z.infer<typeof AddColumnSchema>,
  sequelize: Sequelize,
) => {
  const base = generateMySQLBaseColumnInfoSQL(input, sequelize);
  const escapedFieldName = escapedMySQLName(input.fieldName, sequelize);
  const escapedTableName = escapedMySQLName(input.tableName, sequelize);

  return `ALTER TABLE ${escapedTableName} ADD COLUMN ${escapedFieldName} ${base}`;
};

export const generateMySQLUpdateColumnSQL = (
  input: z.infer<typeof UpdateColumnSchema>,
  sequelize: Sequelize,
) => {
  const base = generateMySQLBaseColumnInfoSQL(input, sequelize);
  const escapedFieldName = escapedMySQLName(input.fieldName, sequelize);
  const escapedOldFieldName = escapedMySQLName(input.oldFieldName, sequelize);
  const escapedTableName = escapedMySQLName(input.tableName, sequelize);

  return `ALTER TABLE ${escapedTableName} CHANGE COLUMN ${escapedOldFieldName} ${escapedFieldName} ${base}`;
};
