import Table from 'cli-table3'

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

  const headers = Object.keys(results[0] || {});
  const table = new Table({ head: headers });

  results.forEach(row => {
    table.push(Object.values(row as object).map(val => val !== null ? val : 'NULL'));
  });

  return table.toString().replace(/\n/g, '\n\r');
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
