import z from 'zod';

import {
  BatchDeleteDataSchema,
  MySQLProcessedDataSchema,
  MysqlBaseColumnInfoSchema,
  MySQLBaseTrigger,
} from '../zod/mysql';

export interface IMySQLColumn {
  Field: string;
  Type: string;
  Seq_in_index: number;
  Key: string;
  Null: string;
  Extra: string;
  Comment: string;
  Default?: unknown;
  Collation?: string;
}

export type TMySQLCondition = z.infer<typeof BatchDeleteDataSchema>['condition'];

export type TMySQLProcessedData = z.infer<typeof MySQLProcessedDataSchema>;

export enum EMySQLDataExportType {
  SQL = 'sql',
  EXCEL = 'excel',
  JSON = 'json',
}

export interface IPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface ILineString {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface IPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export interface IMultiPoint {
  type: 'MultiPoint';
  coordinates: [number, number][];
}

export interface IMultiLineString {
  type: 'MultiLineString';
  coordinates: [number, number][][];
}

export interface IMultiPolygon {
  type: 'MultiPolygon';
  coordinates: [number, number][][][];
}

export interface IGeometryCollection {
  type: 'GeometryCollection';
  geometries: (IPoint | ILineString | IPolygon | IMultiPoint | IMultiLineString | IMultiPolygon)[];
}

export interface IBuffer {
  type: 'Buffer';
  data: number[];
}

export type TMySQLRawData =
  | string
  | number
  | null
  | IBuffer
  | IPoint
  | ILineString
  | IPolygon
  | IMultiPoint
  | IMultiLineString
  | IMultiPolygon
  | IGeometryCollection;

export enum EMySQLIndexType {
  SPATIAL = 'SPATIAL INDEX',
  INDEX = 'INDEX',
  FULLTEXT = 'FULLTEXT INDEX',
  UNIQUE = 'UNIQUE INDEX',
  PRIMARY = 'PRIMARY KEY',
}

export interface IMySQLTableIndex {
  Key_name: string;
  Non_unique: 0 | 1;
  Index_type: string;
  Index_comment: string;
  Column_name: string;
  Seq_in_index: number;
  Collation: 'A' | 'D';
  Sub_part: number | null;
}

export enum EMySQLOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum EMySQLFieldDefaultType {
  NONE = 'NONE',
  NULL = 'NULL',
  EMPTY_STRING = 'EMPTY_STRING',
  CUSTOM = 'CUSTOM',
}

export type TMysqlBaseColumnInfo = z.infer<typeof MysqlBaseColumnInfoSchema>;

export enum EMySQLTriggerEvent {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum EMySQLTriggerTiming {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
}

export type TMySQLTrigger = z.infer<typeof MySQLBaseTrigger>;

export enum EMySQLPureType {
  // 字符串类型
  CHAR = 'char',
  VARCHAR = 'varchar',
  TEXT = 'text',
  TINYTEXT = 'tinytext',
  MEDIUMTEXT = 'mediumtext',
  LONGTEXT = 'longtext',

  // 数值类型
  TINYINT = 'tinyint',
  SMALLINT = 'smallint',
  MEDIUMINT = 'mediumint',
  INT = 'int',
  INTEGER = 'integer',
  BIGINT = 'bigint',
  FLOAT = 'float',
  DOUBLE = 'double',
  DECIMAL = 'decimal',
  NUMERIC = 'numeric',
  REAL = 'real',

  // 日期时间类型
  YEAR = 'year',
  TIMESTAMP = 'timestamp',
  DATETIME = 'datetime',
  TIME = 'time',
  DATE = 'date',

  // 枚举/集合类型
  ENUM = 'enum',
  SET = 'set',

  // 二进制大对象类型
  BLOB = 'blob',
  MEDIUMBLOB = 'mediumblob',
  TINYBLOB = 'tinyblob',
  LONGBLOB = 'longblob',

  // JSON 类型
  JSON = 'json',

  // 位类型
  BIT = 'bit',

  // 二进制字符串类型
  BINARY = 'binary',
  VARBINARY = 'varbinary',

  // 几何类型
  GEOMETRY = 'geometry',
  POINT = 'point',
  LINESTRING = 'linestring',
  POLYGON = 'polygon',
  MULTIPOINT = 'multipoint',
  MULTILINESTRING = 'multilinestring',
  MULTIPOLYGON = 'multipolygon',
  GEOMCOLLECTION = 'geomcollection',
}
