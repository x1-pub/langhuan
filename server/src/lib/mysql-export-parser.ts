import { Sequelize } from 'sequelize';
import XLSX from 'xlsx';

import type {
  TMySQLRawData,
  IMySQLColumn,
  IPoint,
  ILineString,
  IPolygon,
  IMultiPoint,
  IMultiLineString,
  IMultiPolygon,
  IGeometryCollection,
} from '@packages/types/mysql';
import {
  bufferToBase64,
  bufferToBitString,
  bufferToHex,
  bufferToUtf8,
} from '@packages/tools/buffer';
import { extractMySQLTypeLength } from '@packages/tools/mysql-extrac-type-length';
import { mysqlSpatialToString } from '@packages/tools/mysql-spatial-to-string';

interface IDataToJsonAndSQL {
  tableName: string;
  columns: IMySQLColumn[];
  records: Record<string, TMySQLRawData>[];
  fields: string[];
  sequelize: Sequelize;
}

type TInsertQueryBind =
  | string
  | number
  | null
  | Buffer
  | IPoint
  | ILineString
  | IPolygon
  | IMultiPoint
  | IMultiLineString
  | IMultiPolygon
  | IGeometryCollection;

interface IInsertQueryRes {
  query: string;
  bind: TInsertQueryBind[];
}

interface QueryGenerator {
  insertQuery: (tableName: string, record: Record<string, TMySQLRawData>) => IInsertQueryRes;
}

const isBit = (type: string) => type.toLocaleUpperCase().startsWith('BIT');
const isBinary = (type: string) => type.toLocaleUpperCase().includes('BINARY');

export const generateJSON = ({
  tableName,
  columns,
  records,
  fields,
  sequelize,
}: IDataToJsonAndSQL) => {
  const fieldTypeMap: Record<string, string> = columns.reduce(
    (prev, curr) => ({ ...prev, [curr.Field]: curr.Type }),
    {},
  );
  const json: Record<string, string | number | null>[] = [];

  records.forEach(record => {
    const { bind } = (sequelize.getQueryInterface().queryGenerator as QueryGenerator).insertQuery(
      tableName,
      record,
    );

    const values = bind.map((value, index) => {
      const type = fieldTypeMap[fields[index]];

      if (value == null) {
        return null;
      }

      if (typeof value !== 'object') {
        return value;
      }

      if (value instanceof Date) {
        return value.toLocaleString().slice(0, 19).replace('T', ' ');
      }

      if (Buffer.isBuffer(value)) {
        if (isBit(type)) {
          return bufferToBitString(value, extractMySQLTypeLength(type));
        }

        if (isBinary(type)) {
          return bufferToUtf8(value);
        }

        return bufferToBase64(value);
      }

      if (type === 'json') {
        return JSON.stringify(value);
      }

      return `ST_GeomFromText('${mysqlSpatialToString(value)}')`;
    });

    json.push(fields.reduce((prev, curr, index) => ({ ...prev, [curr]: values[index] }), {}));
  });

  return json;
};

export const generateSQL = ({
  tableName,
  columns,
  records,
  fields,
  sequelize,
}: IDataToJsonAndSQL) => {
  const fieldTypeMap: Record<string, string> = columns.reduce(
    (prev, curr) => ({ ...prev, [curr.Field]: curr.Type }),
    {},
  );

  const sql = records.map(record => {
    const { query, bind } = (
      sequelize.getQueryInterface().queryGenerator as QueryGenerator
    ).insertQuery(tableName, record);

    const values = bind.map((value, index) => {
      const type = fieldTypeMap[fields[index]];

      if (value == null) {
        return 'NULL';
      }

      if (typeof value !== 'object') {
        return sequelize.escape(value);
      }

      if (value instanceof Date) {
        return sequelize.escape(value.toLocaleString().slice(0, 19).replace('T', ' '));
      }

      if (Buffer.isBuffer(value)) {
        if (isBit(type)) {
          return `b'${bufferToBitString(value, extractMySQLTypeLength(type))}'`;
        }

        return bufferToHex(value);
      }

      if (type === 'json') {
        return sequelize.escape(JSON.stringify(value));
      }

      return `ST_GeomFromText('${mysqlSpatialToString(value)}')`;
    });

    return query.replace(/\sVALUES\s\((.*)\);$/, ` VALUES (${values.join(', ')});`);
  });

  return sql.join('\n');
};

export const generateExcel = ({
  tableName,
  columns,
  records,
  fields,
  sequelize,
}: IDataToJsonAndSQL) => {
  const json = generateJSON({ tableName, columns, records, fields, sequelize });

  const worksheet = XLSX.utils.json_to_sheet(json);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const excelBuffer: Buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  return excelBuffer;
};
