import { EMySQLPureType, IBuffer, TMySQLProcessedData, TMySQLRawData } from '@packages/types/mysql';
import { BINARY_TYPES, BLOB_TYPES, GEOMETRY_TYPES } from './mysql-type-groups';
import { mysqlSpatialToString } from '@packages/tools/mysql-spatial-to-string';
import i18n from '@/i18n';

const normalizeSqlDateTimeValue = (value: string) => {
  return value
    .trim()
    .replace('T', ' ')
    .replace(/\.\d+$/, '')
    .replace(/(Z|[+-]\d{2}:?\d{2})$/, '')
    .trim();
};

const formatDateToSqlDateTime = (value: Date) => {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  const hour = String(value.getUTCHours()).padStart(2, '0');
  const minute = String(value.getUTCMinutes()).padStart(2, '0');
  const second = String(value.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

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
    if (typeof value === 'string') {
      return normalizeSqlDateTimeValue(value);
    }

    if (value instanceof Date) {
      return formatDateToSqlDateTime(value);
    }
  }

  return value as string | number;
};

export const getMySQLPureType = (type: string) => {
  if (!type || typeof type !== 'string') {
    throw new Error(i18n.t('mysql.invalidTypeParam'));
  }

  const pureType = type.split(/\s|\(/)[0].trim().toLowerCase();

  const supportedTypes = Object.values(EMySQLPureType) as string[];
  if (!supportedTypes.includes(pureType)) {
    throw new Error(i18n.t('mysql.unsupportedType', { type }));
  }

  return pureType as EMySQLPureType;
};
