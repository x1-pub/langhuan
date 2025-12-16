export enum EEditorType {
  CREATE_TABLE = '1',
  EDIT_TABLE = '2',
  CREATE_DB = '3',
  EDIT_DB = '4',
}

interface ICreateDatabaseData {
  type: EEditorType.CREATE_DB;
}

interface IEditDatabaseOrData {
  type: EEditorType.EDIT_DB;
  dbName: string;
  comment?: string;
  charset?: string;
  collation?: string;
}

interface ICreateTableData {
  type: EEditorType.CREATE_TABLE;
  dbName: string;
}

interface IEditTableData {
  type: EEditorType.EDIT_TABLE;
  dbName: string;
  tableName: string;
  comment?: string;
}

export type TEditorData =
  | ICreateDatabaseData
  | IEditDatabaseOrData
  | ICreateTableData
  | IEditTableData;
