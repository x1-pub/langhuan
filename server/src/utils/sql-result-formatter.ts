import Table from 'cli-table3'

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

export function getStatementType(sql: string) {
  const lowerSql = sql.trim().toLowerCase();
  if (lowerSql.startsWith('select') || lowerSql.startsWith('show') || lowerSql.startsWith('desc')) {
    return 'query';
  }
  if (lowerSql.startsWith('update')) return 'update';
  if (lowerSql.startsWith('insert')) return 'insert';
  if (lowerSql.startsWith('delete')) return 'delete';
  if (lowerSql.startsWith('use')) return 'use';
  return 'other';
}

export function formatQueryResult(results: unknown[]) {
  if (results.length === 0) return 'Empty result set';

  const headers = Object.keys(results[0] || {}).map(head => `${colors.green}${head}${colors.reset}`);
  const table = new Table({ head: headers });

  results.forEach(row => {
    table.push(Object.values(row as object).map(val => val !== null ? val : 'NULL'));
  });

  return table.toString();
}

export function formatNonQueryResult(type: ReturnType<typeof getStatementType>, metadata: any) {
  switch (type) {
    case 'update':
      return `Updated ${metadata.changedRows} row(s) (matched ${metadata.affectedRows} row(s))`;
    case 'insert':
      return `Inserted ${metadata.affectedRows} row(s), last insert ID: ${metadata.insertId}`;
    case 'delete':
      return `Deleted ${metadata.affectedRows} row(s)`;
    case 'use':
      return 'Database changed';
    default:
      return `Statement executed, affected rows: ${metadata.affectedRows}`;
  }
}
