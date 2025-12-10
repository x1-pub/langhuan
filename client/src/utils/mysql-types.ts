import { EMySQLPureType } from '@packages/types/mysql';

export const STRING_TYPES = [
  EMySQLPureType.CHAR,
  EMySQLPureType.VARCHAR,
  EMySQLPureType.TEXT,
  EMySQLPureType.TINYTEXT,
  EMySQLPureType.MEDIUMTEXT,
  EMySQLPureType.LONGTEXT,
];

export const NUMBER_TYPES = [
  EMySQLPureType.TINYINT,
  EMySQLPureType.SMALLINT,
  EMySQLPureType.MEDIUMINT,
  EMySQLPureType.INT,
  EMySQLPureType.INTEGER,
  EMySQLPureType.BIGINT,
  EMySQLPureType.FLOAT,
  EMySQLPureType.DOUBLE,
  EMySQLPureType.DECIMAL,
  EMySQLPureType.NUMERIC,
  EMySQLPureType.REAL,
];

export const DATETIME_TYPES = [
  EMySQLPureType.YEAR,
  EMySQLPureType.TIMESTAMP,
  EMySQLPureType.DATETIME,
  EMySQLPureType.TIME,
  EMySQLPureType.DATE,
];

export const ENUM_SET_TYPES = [EMySQLPureType.ENUM, EMySQLPureType.SET];

export const BINARY_TYPES = [EMySQLPureType.BINARY, EMySQLPureType.VARBINARY];

export const BLOB_TYPES = [
  EMySQLPureType.BLOB,
  EMySQLPureType.MEDIUMBLOB,
  EMySQLPureType.TINYBLOB,
  EMySQLPureType.LONGBLOB,
];

export const GEOMETRY_TYPES = [
  EMySQLPureType.GEOMETRY,
  EMySQLPureType.POINT,
  EMySQLPureType.LINESTRING,
  EMySQLPureType.POLYGON,
  EMySQLPureType.MULTIPOINT,
  EMySQLPureType.MULTILINESTRING,
  EMySQLPureType.MULTIPOLYGON,
  EMySQLPureType.GEOMCOLLECTION,
];
