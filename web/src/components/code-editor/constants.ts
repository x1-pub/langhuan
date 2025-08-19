
// SQL关键字 
export const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP',
  'ALTER', 'TABLE', 'INDEX', 'VIEW', 'DATABASE', 'SCHEMA', 'PROCEDURE',
  'FUNCTION', 'TRIGGER', 'CONSTRAINT', 'PRIMARY', 'KEY', 'FOREIGN',
  'REFERENCES', 'UNIQUE', 'NOT', 'NULL', 'DEFAULT', 'CHECK', 'AUTO_INCREMENT',
  'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'JOIN', 'ON', 'UNION',
  'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
  'DISTINCT', 'ALL', 'EXISTS', 'IN', 'BETWEEN', 'LIKE', 'IS', 'AND', 'OR',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IF', 'IFNULL', 'COALESCE',
  'CAST', 'CONVERT', 'SUBSTRING', 'CONCAT', 'LENGTH', 'UPPER', 'LOWER',
  'TRIM', 'REPLACE', 'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'YEAR',
  'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND', 'NOW', 'CURRENT_DATE',
  'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'FIRST', 'LAST', 'TOP', 'AS', 'ALIAS'
];

// SQL函数 
export const SQL_FUNTIONS = [
  {
    name: 'COUNT',
    insertText: 'COUNT(${1:*})',
    detail: '聚合函数',
    documentation: '返回行数'
  },
  {
    name: 'SUM',
    insertText: 'SUM(${1:column})',
    detail: '聚合函数',
    documentation: '返回数值列的总和'
  },
  {
    name: 'AVG',
    insertText: 'AVG(${1:column})',
    detail: '聚合函数',
    documentation: '返回数值列的平均值'
  },
  {
    name: 'MAX',
    insertText: 'MAX(${1:column})',
    detail: '聚合函数',
    documentation: '返回列的最大值'
  },
  {
    name: 'MIN',
    insertText: 'MIN(${1:column})',
    detail: '聚合函数',
    documentation: '返回列的最小值'
  },
  {
    name: 'CONCAT',
    insertText: 'CONCAT(${1:str1}, ${2:str2})',
    detail: '字符串函数',
    documentation: '连接两个或多个字符串'
  },
  {
    name: 'SUBSTRING',
    insertText: 'SUBSTRING(${1:string}, ${2:start}, ${3:length})',
    detail: '字符串函数',
    documentation: '提取字符串的子串'
  },
  {
    name: 'UPPER',
    insertText: 'UPPER(${1:string})',
    detail: '字符串函数',
    documentation: '将字符串转换为大写'
  },
  {
    name: 'LOWER',
    insertText: 'LOWER(${1:string})',
    detail: '字符串函数',
    documentation: '将字符串转换为小写'
  },
  {
    name: 'NOW',
    insertText: 'NOW()',
    detail: '日期函数',
    documentation: '返回当前日期和时间'
  }
];