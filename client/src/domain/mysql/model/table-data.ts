import type { IMySQLColumn, TMySQLCondition, TMySQLRawData } from '@packages/types/mysql';

import { getConditionValue, getMySQLPureType } from '@/domain/mysql/model/mysql-value';

export const MYSQL_TABLE_ROW_KEY_FIELD = '__mysql_row_key' as const;
export const MYSQL_DEFAULT_PAGE_SIZE = 20;
export const MYSQL_DEFAULT_WHERE_CLAUSE = 'WHERE 1 = 1';
export const MYSQL_PAGE_SIZE_OPTIONS = [10, MYSQL_DEFAULT_PAGE_SIZE, 50, 100, 500];
export const MYSQL_TABLE_SELECTION_COLUMN_WIDTH = 24;
export const MYSQL_COLUMN_MIN_DISPLAY_WIDTH = 250;
export const MYSQL_COLUMN_PADDING_WIDTH = 32;

export interface MySQLTableDataPagination {
  current: number;
  pageSize: number;
}

export type MySQLTableDataRow = Record<string, TMySQLRawData> & {
  [MYSQL_TABLE_ROW_KEY_FIELD]: string;
};

const toRowKeyPart = (value: TMySQLRawData): string => {
  if (value === null) {
    return 'NULL';
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

export const sanitizeWhereClause = (value: string): string => {
  const trimmed = value.trim().replace(/;+\s*$/, '');
  return trimmed || MYSQL_DEFAULT_WHERE_CLAUSE;
};

export const getPrimaryColumnFields = (columns: IMySQLColumn[]) =>
  columns.filter(column => column.Key === 'PRI').map(column => column.Field);

export const buildMySQLTableRows = ({
  list,
  columns,
  pagination,
}: {
  list: Record<string, TMySQLRawData>[];
  columns: IMySQLColumn[];
  pagination: MySQLTableDataPagination;
}): MySQLTableDataRow[] => {
  const primaryFields = getPrimaryColumnFields(columns);

  return list.map((row, rowIndex) => {
    const rowKey = primaryFields.length
      ? primaryFields.map(field => toRowKeyPart(row[field])).join('::')
      : `${pagination.current}-${pagination.pageSize}-${rowIndex}`;

    return {
      ...row,
      [MYSQL_TABLE_ROW_KEY_FIELD]: rowKey,
    };
  });
};

export const buildMySQLConditionFromRows = ({
  columns,
  rows,
  selectedRowKeys,
}: {
  columns: IMySQLColumn[];
  rows: MySQLTableDataRow[];
  selectedRowKeys: string[];
}): TMySQLCondition => {
  const condition: TMySQLCondition = [];
  const selectedRowKeySet = new Set(selectedRowKeys);
  const typeMap: Record<string, string> = {};
  const primaryFields = getPrimaryColumnFields(columns);
  const conditionFields = primaryFields.length
    ? primaryFields
    : columns.map(column => column.Field);

  columns.forEach(column => {
    typeMap[column.Field] = getMySQLPureType(column.Type);
  });

  rows.forEach(row => {
    if (!selectedRowKeySet.has(row[MYSQL_TABLE_ROW_KEY_FIELD])) {
      return;
    }

    const rowCondition: TMySQLCondition[number] = {};
    conditionFields.forEach(field => {
      rowCondition[field] = getConditionValue(row[field], typeMap[field]);
    });
    condition.push(rowCondition);
  });

  return condition;
};
