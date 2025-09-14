import request from "@/utils/request";

export interface Column {
  Field: string;
  Type: string; // TODO
  Key: string;
  Null: string;
  Extra: string;
  Comment: string;
  Default: any;
  Collation?: string;
}
export interface MysqlDataRsp {
  total: number;
  list: Record<string, any>[];
  columns: Column[];
}

export interface TableStatusRsp {
  TABLE_CATALOG: string;
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
  TABLE_TYPE: string;
  ENGINE: string;
  ROW_FORMAT: string;
  CREATE_TIME: string;
  UPDATE_TIME: string;
  CHECK_TIME: string;
  TABLE_COLLATION: string;
  CREATE_OPTIONS: string;
  TABLE_COMMENT: string;
  VERSION: number;
  TABLE_ROWS: number;
  AVG_ROW_LENGTH: number;
  DATA_LENGTH: number;
  MAX_DATA_LENGTH: number;
  INDEX_LENGTH: number;
  DATA_FREE: number;
  AUTO_INCREMENT: number;
  CHECKSUM: number;
}

export interface TableIndex {
  Key_name: string;
  Non_unique: 0 | 1;
  Index_type: string;
  Index_comment: string;
  Column_name: string;
  Seq_in_index: number;
  Collation: 'A' | 'D';
  Sub_part: number | null;
}

interface MysqlBaseParams {
  connectionId: string;
  dbName: string;
  tableName: string;
}

export enum IndexType {
  SPATIAL = 'SPATIAL INDEX',
  INDEX = 'INDEX',
  FULLTEXT = 'FULLTEXT INDEX',
  UNIQUE = 'UNIQUE INDEX',
  PRIMARY = 'PRIMARY KEY',
}

interface TableIndexForm {
  name: string;
  data: {
    type: IndexType;
    field: {
      name: string;
      len?: number | null;
      order?: 'ASC' | 'DESC';
    }[];
    comment?: string;
  }
}

export enum TriggerEvent {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export enum TriggerTiming {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER'
}

export interface TriggerData {
  name: string;
  event: TriggerEvent;
  timing: TriggerTiming;
  statement: string;
}


interface GetMysqlData extends MysqlBaseParams {
  current: number;
  pageSize: number;
  condition: string;
}
export const getMysqlData = (params: GetMysqlData) => request<MysqlDataRsp>({
  method: 'GET',
  params,
  url: '/api/mysql/mysql_data',
})

interface UpdateParams extends MysqlBaseParams {
  data: Record<string, any>;
  condition: Record<string, any>[];
}
export const update = (data: UpdateParams) => request<number>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_update',
})

interface InsertOneParams extends MysqlBaseParams {
  data: Record<string, any>;
}
export const insertOne = (data: InsertOneParams) => request<number>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_insert_one',
})

interface BatchDeleteParams extends MysqlBaseParams {
  condition: Record<string, any>[];
}
export const batchDelete = (data: BatchDeleteParams) => request<number>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_batch_delete',
})

export const tableDDL = (data: MysqlBaseParams) => request<string>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_table_ddl',
})

export const tableColumns = (data: MysqlBaseParams) => request<Column[]>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_table_columns',
})

export const tableIndex = (data: MysqlBaseParams) => request<TableIndex[]>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_table_index',
})

export const tableStatus = (data: MysqlBaseParams) => request<TableStatusRsp>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_table_status',
})

export const addTableIndex = (data: Omit<TableIndexForm & MysqlBaseParams, 'name'>) => request<void>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_add_index',
})

export const updateTableIndex = (data: TableIndexForm & MysqlBaseParams) => request<void>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_update_index',
})

export const deleteTableIndex = (data: { name: string } & MysqlBaseParams) => request<void>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_delete_index',
})

export interface MySqlFieldData {
  oldFieldName?: string;
  fieldName: string;
  fieldType: string;
  fieldExtra?: string;
  allowNull: boolean;
  defaultValue?: string;
  defaultValueType?: 'NONE' | 'NULL' | 'EMPTY_STRING' | 'CUSTOM';
  onUpdateCurrentTime?: boolean;
  isPrimary?: boolean;
  autoIncrement?: boolean;
  unsigned?: boolean;
  zerofill?: boolean;
  charset?: string;
  collation?: string;
  comment?: string;
}

export const addorUpdateColumn = (data: { data: MySqlFieldData } & MysqlBaseParams) => request<void>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_add_or_update_column',
})

export const deleteColumn = (data: { name: string } & MysqlBaseParams) => request<void>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_delete_column',
})

interface ExecuteSQLParams {
  connectionId: string | number;
  command: string;
  sessionId: string;
}
export const executeMySqlCommand = (data: ExecuteSQLParams) => request<{ result: string, changeDatabase?: string; }>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_execute',
})

interface ExportSqlParams extends BatchDeleteParams {
  fields: string[];
  type: 'excel' | 'sql' | 'json';
}
export const exportData = (data: ExportSqlParams) => request<string>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_export',
  responseType: 'blob',
})

export const columnOrder = (data: { fields: string[] } & MysqlBaseParams) => request<void>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_column_order',
})

export const tableTrigger = (data: MysqlBaseParams) => request<TriggerData[]>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_trigger',
})

export const addTrigger = (data: MysqlBaseParams & TriggerData) => request<void>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_add_trigger',
})

export const modifyTrigger = (data: MysqlBaseParams & TriggerData & { oldName: string }) => request<void>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_modify_trigger',
})

export const deleteTrigger = (data: MysqlBaseParams & { name: string }) => request<void>({
  method: 'POST',
  data,
  url: '/api/mysql/mysql_delete_trigger',
})
