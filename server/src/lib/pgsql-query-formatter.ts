import Table from 'cli-table3';
import { QueryResult } from 'pg';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
};

export const formatPgsqlQueryResult = (rows: Record<string, unknown>[]) => {
  if (rows.length === 0) {
    return 'Empty result set';
  }

  const headers = Object.keys(rows[0] || {}).map(
    header => `${colors.green}${header}${colors.reset}`,
  );
  const table = new Table({ head: headers });

  rows.forEach(row => {
    table.push(Object.values(row).map(value => (value === null ? 'NULL' : String(value))));
  });

  return table.toString();
};

export const formatPgsqlCommandResult = (result: QueryResult<Record<string, unknown>>) => {
  if (result.rows.length > 0) {
    return formatPgsqlQueryResult(result.rows);
  }

  return `${result.command} ${result.rowCount ?? 0}`;
};
