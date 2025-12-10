/**
 * 从 DDL 里解析出列定义
 * @param {string} ddl SHOW CREATE TABLE 返回的 DDL
 * @returns {Record<string, string>} { colName: definition }
 */
const parseColumnsFromDDL = (ddl: string) => {
  const inside = ddl.match(/\(([\s\S]*)\)\s*ENGINE/i)?.[1] || '';

  const lines = inside
    .split(/\n/)
    .map(l => l.trim())
    .filter(
      l => l && !l.startsWith('PRIMARY KEY') && !l.startsWith('KEY') && !l.startsWith('CONSTRAINT'),
    );

  const columns: Record<string, string> = {};
  for (const line of lines) {
    const m = line.match(/^`([^`]+)`\s+(.*?)(,)?$/);
    if (m) {
      const colName = m[1];
      const colDef = m[2].trim();
      columns[colName] = colDef;
    }
  }
  return columns;
};

/**
 * 生成 ALTER TABLE SQL 用于调整列顺序
 * @param {string} tableName 表名
 * @param {Record<string, string>} columns {colName: definition}
 * @param {string[]} newOrder 新的字段顺序
 */
const generateAlterSQL = (
  tableName: string,
  columns: Record<string, string>,
  newOrder: string[],
) => {
  const sqlParts: string[] = [];

  newOrder.forEach((col, index) => {
    const def = columns[col];
    if (!def) throw new Error(`字段 ${col} 不存在`);

    if (index === 0) {
      sqlParts.push(`MODIFY COLUMN \`${col}\` ${def} FIRST`);
    } else {
      const prev = newOrder[index - 1];
      sqlParts.push(`MODIFY COLUMN \`${col}\` ${def} AFTER \`${prev}\``);
    }
  });

  return `ALTER TABLE \`${tableName}\`\n  ${sqlParts.join(',\n  ')};`;
};

/**
 * 主逻辑：DDL -> 解析列 -> 生成SQL
 */
export const sortMysqlDdlFields = (ddl: string, tableName: string, newOrder: string[]) => {
  const columns = parseColumnsFromDDL(ddl);
  return generateAlterSQL(tableName, columns, newOrder);
};
