/**
 * 从 MySQL 类型字符串中提取第一个括号里的数字
 * @param typeStr MySQL 类型字符串，如 "bit(8)", "varchar(255)", "decimal(10,2)"
 * @returns number
 */
export function extractMySQLTypeLength(typeStr: string): number {
  const match = typeStr.match(/\((\d+)/);
  return match ? Number(match[1]) : 0;
}
