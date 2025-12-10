import { EMySQLPureType, IBuffer, TMySQLProcessedData, TMySQLRawData } from '@packages/types/mysql';
import { BINARY_TYPES, BLOB_TYPES, GEOMETRY_TYPES } from './mysql-types';
import { mysqlSpatialToString } from '@packages/tools/mysql-spatial-to-string';

export const getConditionValue = (value: TMySQLRawData, type: string): TMySQLProcessedData => {
  const pureType = getMySQLPureType(type);

  if (!value) {
    return value;
  }

  if (EMySQLPureType.JSON === pureType) {
    return { type: 'json', value: JSON.stringify(value) };
  }

  if ([...BLOB_TYPES, ...BINARY_TYPES, EMySQLPureType.BIT].includes(pureType)) {
    return { type: 'buffer', value: (value as IBuffer).data };
  }

  if (GEOMETRY_TYPES.includes(pureType)) {
    return {
      type: 'spatial',
      value: mysqlSpatialToString(
        value as Exclude<TMySQLRawData, string | number | IBuffer | null>,
      ),
    };
  }

  if ([EMySQLPureType.TIMESTAMP, EMySQLPureType.DATETIME].includes(pureType)) {
    return new Date((value as string).replace(' ', 'T'))
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
  }

  return value as string | number;
};

export const getMySQLPureType = (type: string) => {
  if (!type || typeof type !== 'string') {
    throw new Error('MySQL 类型参数不能为空，且必须是字符串类型');
  }

  const pureType = type.split('(')[0].trim().toLowerCase();

  const supportedTypes = Object.values(EMySQLPureType) as string[];
  if (!supportedTypes.includes(pureType)) {
    throw new Error(`不支持的 MySQL 类型：${type}`);
  }

  return pureType as EMySQLPureType;
};
