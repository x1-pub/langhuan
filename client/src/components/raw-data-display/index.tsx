import React from 'react';
import { Buffer } from 'buffer';

import { EMySQLPureType, TMySQLRawData } from '@packages/types/mysql';
import { mysqlSpatialToString } from '@packages/tools/mysql-spatial-to-string';
import {
  BINARY_TYPES,
  BLOB_TYPES,
  DATETIME_TYPES,
  ENUM_SET_TYPES,
  GEOMETRY_TYPES,
  NUMBER_TYPES,
  STRING_TYPES,
} from '@/utils/mysql-types';
import { getMySQLPureType } from '@/utils/mysql-generator';

type TEngine = 'mysql' | 'pgsql';

interface RawDataDisplayProps {
  engine?: TEngine;
  type: string;
  value?: unknown;
}

const isPgsqlDateLikeType = (type: string) => {
  const lower = type.toLowerCase();
  return lower.includes('date') || lower.includes('time');
};

const isPgsqlTimestampWithTimezoneType = (type: string) => {
  const lower = type.toLowerCase();
  return lower === 'timestamptz' || lower.includes('timestamp with time zone');
};

const isPgsqlTimeWithTimezoneType = (type: string) => {
  const lower = type.toLowerCase();
  return lower === 'timetz' || lower.includes('time with time zone');
};

const formatDateToUtcDateTime = (value: Date) => {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  const hour = String(value.getUTCHours()).padStart(2, '0');
  const minute = String(value.getUTCMinutes()).padStart(2, '0');
  const second = String(value.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const normalizeTimeZoneSuffix = (value: string, keepTimeZone: boolean) => {
  if (!keepTimeZone) {
    return value.replace(/(Z|[+-]\d{2}:?\d{2})$/, '').trim();
  }

  if (value.endsWith('Z')) {
    return `${value.slice(0, -1)}+00:00`;
  }

  const withColon = value.match(/([+-]\d{2})(\d{2})$/);
  if (withColon) {
    return `${value.slice(0, -5)}${withColon[1]}:${withColon[2]}`;
  }

  return value;
};

const normalizeSqlDateText = (value: string, keepTimeZone: boolean) => {
  const next = value.trim().replace('T', ' ').replace(/\.\d+/, '');

  return normalizeTimeZoneSuffix(next, keepTimeZone);
};

const normalizeSqlTimeText = (value: string, keepTimeZone: boolean) => {
  const next = value
    .trim()
    .replace(/^2000-01-01\s+/i, '')
    .replace(/\.\d+/, '');

  return normalizeTimeZoneSuffix(next, keepTimeZone);
};

const formatPgsqlDateValue = (type: string, value: string) => {
  const lower = type.toLowerCase();
  if (lower.includes('timestamp')) {
    return normalizeSqlDateText(value, isPgsqlTimestampWithTimezoneType(type));
  }
  if (lower.includes('date')) {
    return normalizeSqlDateText(value, false).slice(0, 10);
  }
  if (lower.includes('time')) {
    return normalizeSqlTimeText(value, isPgsqlTimeWithTimezoneType(type));
  }
  return value;
};

const renderMysqlValue = (type: string, value: TMySQLRawData) => {
  const pureType = getMySQLPureType(type);

  if (value === null || value === undefined) return null;

  if ([...STRING_TYPES, ...NUMBER_TYPES, ...ENUM_SET_TYPES].includes(pureType)) {
    return <>{value}</>;
  }

  if (DATETIME_TYPES.includes(pureType)) {
    if (value instanceof Date) {
      if (pureType === EMySQLPureType.TIME) {
        return <>{formatDateToUtcDateTime(value).slice(11)}</>;
      }
      if (pureType === EMySQLPureType.DATE) {
        return <>{formatDateToUtcDateTime(value).slice(0, 10)}</>;
      }
      if (pureType === EMySQLPureType.YEAR) {
        return <>{String(value.getUTCFullYear())}</>;
      }

      return <>{formatDateToUtcDateTime(value)}</>;
    }

    const text = String(value);

    if (pureType === EMySQLPureType.TIME) {
      return <>{normalizeSqlTimeText(text, false)}</>;
    }
    if (pureType === EMySQLPureType.DATE) {
      return <>{normalizeSqlDateText(text, false).slice(0, 10)}</>;
    }
    if (pureType === EMySQLPureType.YEAR) {
      return <>{text.slice(0, 4)}</>;
    }

    return <>{normalizeSqlDateText(text, false)}</>;
  }

  if (EMySQLPureType.JSON === pureType) {
    return <>{JSON.stringify(value)}</>;
  }

  if (EMySQLPureType.BIT === pureType) {
    if (typeof value !== 'object' || value.type !== 'Buffer') return null;

    const buffer = Buffer.from(value.data);
    const binaryString16 = buffer.toString('hex');
    const binaryString2 = parseInt(binaryString16, 16).toString(2);
    const len = Number(type.slice(4, -1));
    const data = binaryString2.padStart(len, '0');

    return <>{data}</>;
  }

  if (BINARY_TYPES.includes(pureType)) {
    if (typeof value !== 'object' || value.type !== 'Buffer') return null;

    const buffer = value.data;
    let lastNonZeroIndex = buffer.length - 1;
    while (lastNonZeroIndex >= 0 && buffer[lastNonZeroIndex] === 0) {
      lastNonZeroIndex--;
    }
    const validData = buffer.slice(0, lastNonZeroIndex + 1);
    const data = Buffer.from(validData).toString();

    return <>{data}</>;
  }

  if (BLOB_TYPES.includes(pureType)) {
    if (typeof value !== 'object' || value.type !== 'Buffer') return null;

    return <>{`(BLOB) ${value.data.length} bytes`}</>;
  }

  if (GEOMETRY_TYPES.includes(pureType)) {
    if (typeof value !== 'object' || value.type === 'Buffer') return null;

    return <>{mysqlSpatialToString(value)}</>;
  }

  return <>{String(value)}</>;
};

const RawDataDisplay: React.FC<RawDataDisplayProps> = ({ engine = 'mysql', type, value = '' }) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (engine === 'pgsql') {
    if (value instanceof Date) {
      return <>{formatDateToUtcDateTime(value)}</>;
    }

    if (typeof value === 'object') {
      return <>{JSON.stringify(value)}</>;
    }

    if (typeof value === 'string' && isPgsqlDateLikeType(type)) {
      return <>{formatPgsqlDateValue(type, value)}</>;
    }

    return <>{String(value)}</>;
  }

  return renderMysqlValue(type, value as TMySQLRawData);
};

export default RawDataDisplay;
