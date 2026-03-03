export type PgsqlActiveTab =
  | 'table-data'
  | 'table-design'
  | 'table-triggers'
  | 'table-partitions'
  | 'table-ddl'
  | 'table-stats';

export interface PgsqlTableRow {
  __pg_ctid: string;
  [key: string]: unknown;
}

export interface PgsqlColumnInfo {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue: string | null;
  comment: string | null;
  isPrimaryKey: boolean;
  isIdentity: boolean;
  identityGeneration: 'ALWAYS' | 'BY DEFAULT' | null;
}

export interface PgsqlIndexInfo {
  name: string;
  definition: string;
}

export interface PgsqlTriggerInfo {
  name: string;
  timing: string;
  event: string;
  status: string;
  definition: string;
}

export interface PgsqlPartitionInfo {
  name: string;
  strategy: string;
  partitionKey: string;
  bound: string;
  totalSize: string;
  liveRows: string;
}

export interface PgsqlRowEditorState {
  mode: 'create' | 'edit';
  ctid?: string;
  content: string;
}

export const PGSQL_DEFAULT_PAGE_SIZE = 20;
export const PGSQL_DEFAULT_WHERE_CLAUSE = 'WHERE 1 = 1';
export const PGSQL_TABLE_PAGE_SIZE_OPTIONS = [10, PGSQL_DEFAULT_PAGE_SIZE, 50, 100, 500];
export const PGSQL_COLUMN_MIN_WIDTH = 180;
export const PGSQL_COLUMN_MAX_WIDTH = 380;
export const PGSQL_ROW_EDITOR_DEFAULT_CONTENT = '{\n  \n}';

export const toSafeText = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
};

export const normalizeWhereClause = (value: string) => {
  const trimmed = value.trim().replace(/;+\s*$/, '');
  if (!trimmed) {
    return '';
  }

  return trimmed.replace(/^where\s+/i, '').trim();
};
