import React from 'react';
import dayjs from 'dayjs';
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

const DATE_FORMAT_MAP = {
  [EMySQLPureType.TIME]: 'HH:mm:ss',
  [EMySQLPureType.DATE]: 'YYYY-MM-DD',
  [EMySQLPureType.YEAR]: 'YYYY',
  [EMySQLPureType.TIMESTAMP]: 'YYYY-MM-DD HH:mm:ssZ',
  [EMySQLPureType.DATETIME]: 'YYYY-MM-DD HH:mm:ssZ',
} as const;

interface MySQLRawDataDisplayProps {
  type: string;
  value?: TMySQLRawData;
}

const MySQLRawDataDisplay: React.FC<MySQLRawDataDisplayProps> = ({ type, value = '' }) => {
  const pureType = getMySQLPureType(type);

  if (!value) return null;

  if ([...STRING_TYPES, ...NUMBER_TYPES, ...ENUM_SET_TYPES].includes(pureType)) {
    return <>{value}</>;
  }

  if (DATETIME_TYPES.includes(pureType)) {
    const data = pureType === EMySQLPureType.TIME ? `2000-01-01 ${value}` : (value as string);
    return <>{dayjs(data).format(DATE_FORMAT_MAP[pureType as keyof typeof DATE_FORMAT_MAP])}</>;
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
};

export default MySQLRawDataDisplay;
