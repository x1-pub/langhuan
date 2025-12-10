import React from 'react';
import dayjs from 'dayjs';
import { Buffer } from 'buffer';
import { DatePicker, Input, InputNumber, Select } from 'antd';

import { EMySQLPureType, TMySQLProcessedData, TMySQLRawData } from '@packages/types/mysql';
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

const DATE_PICKER_PICKER_MAP = {
  [EMySQLPureType.TIME]: 'time',
  [EMySQLPureType.DATE]: 'date',
  [EMySQLPureType.YEAR]: 'year',
  [EMySQLPureType.TIMESTAMP]: 'date',
  [EMySQLPureType.DATETIME]: 'date',
};

const DATE_PICKER_FORMAT_MAP = {
  [EMySQLPureType.TIME]: 'HH:mm:ss',
  [EMySQLPureType.DATE]: 'YYYY-MM-DD',
  [EMySQLPureType.YEAR]: 'YYYY',
  [EMySQLPureType.TIMESTAMP]: 'YYYY-MM-DD HH:mm:ssZ',
  [EMySQLPureType.DATETIME]: 'YYYY-MM-DD HH:mm:ssZ',
} as const;

interface MySQLRawDataEditorProps {
  type: string;
  value?: TMySQLRawData;
  style?: React.CSSProperties;
  onChange?: (value: TMySQLProcessedData) => void;
}

const MySQLRawDataEditor: React.FC<MySQLRawDataEditorProps> = ({
  type,
  value,
  style,
  onChange,
}) => {
  const pureType = getMySQLPureType(type);

  const handleChange = (v?: string | number | null) => {
    if (!v) {
      // @ts-expect-error TODO
      onChange?.(v);
      return;
    }

    if (GEOMETRY_TYPES.includes(pureType)) {
      onChange?.({
        type: 'spatial',
        value: v as string,
      });
      return;
    }

    if (pureType === EMySQLPureType.JSON) {
      onChange?.({
        type: 'json',
        value: v as string,
      });
      return;
    }

    if ([EMySQLPureType.BIT, ...BINARY_TYPES].includes(pureType)) {
      onChange?.({
        type: 'buffer',
        value: Array.from(Buffer.from(v as string)),
      });
      return;
    }

    onChange?.(v);
  };

  if (STRING_TYPES.includes(pureType)) {
    return (
      <Input
        defaultValue={value as string}
        onChange={e => handleChange(e.target.value)}
        style={{ width: '100%', ...style }}
      />
    );
  }

  if (NUMBER_TYPES.includes(pureType)) {
    return (
      <InputNumber
        defaultValue={value as string}
        onChange={handleChange}
        style={{ width: '100%', ...style }}
      />
    );
  }

  if (DATETIME_TYPES.includes(pureType)) {
    const defaultValue = value
      ? dayjs(pureType === EMySQLPureType.TIME ? `2000-01-01 ${value}` : String(value))
      : undefined;
    const format = DATE_PICKER_FORMAT_MAP[pureType as keyof typeof DATE_PICKER_FORMAT_MAP];

    return (
      <DatePicker
        defaultValue={defaultValue}
        onChange={newValue => handleChange(newValue.format(format))}
        showTime={[EMySQLPureType.TIMESTAMP, EMySQLPureType.DATETIME].includes(pureType)}
        format={format}
        // @ts-expect-error PickMode
        picker={DATE_PICKER_PICKER_MAP[pureType]}
        style={{ width: '100%', ...style }}
      />
    );
  }

  if (ENUM_SET_TYPES.includes(pureType)) {
    const options = type
      .match(/(set|enum)\((.*)\)/)?.[2]
      ?.split(',')
      .map(v => v.slice(1, -1))
      .map(v => ({ label: v, value: v }));
    const defaultValue =
      EMySQLPureType.SET === pureType ? (value as string)?.split(',') : (value as string);

    return (
      <Select
        mode={EMySQLPureType.SET === pureType ? 'multiple' : undefined}
        defaultValue={defaultValue}
        onChange={v => handleChange(Array.isArray(v) ? v.join(',') : v)}
        options={options || []}
        style={{ width: '100%', ...style }}
      />
    );
  }

  if (EMySQLPureType.JSON === pureType) {
    const defaultValue =
      value && typeof value === 'object' ? JSON.stringify(value) : (value as string);

    return (
      <Input.TextArea
        defaultValue={defaultValue}
        onChange={e => handleChange(e.target.value)}
        style={{ width: '100%', ...style }}
      />
    );
  }

  if (EMySQLPureType.BIT === pureType) {
    let defaultValue: string = '';
    if (value && typeof value === 'object' && value.type === 'Buffer') {
      const buffer = Buffer.from(value.data);
      const binaryString16 = buffer.toString('hex');
      const binaryString2 = parseInt(binaryString16, 16).toString(2);
      const len = Number(type.slice(4, -1));
      defaultValue = binaryString2.padStart(len, '0');
    }

    return (
      <Input
        addonBefore="b'"
        addonAfter="'"
        defaultValue={defaultValue}
        onChange={e => handleChange(e.target.value)}
        style={{ width: '100%', ...style }}
      />
    );
  }

  if (BINARY_TYPES.includes(pureType)) {
    let buffer: number[] = [];
    if (value && typeof value === 'object' && value.type === 'Buffer') {
      buffer = value.data;
    }

    let lastNonZeroIndex = buffer.length - 1;
    while (lastNonZeroIndex >= 0 && buffer[lastNonZeroIndex] === 0) {
      lastNonZeroIndex--;
    }
    const validData = buffer.slice(0, lastNonZeroIndex + 1);
    const defaultValue = Buffer.from(validData).toString();

    return (
      <Input
        defaultValue={defaultValue}
        onChange={e => handleChange(e.target.value)}
        style={{ width: '100%', ...style }}
      />
    );
  }

  if (BLOB_TYPES.includes(pureType)) {
    let defaultValue: string = '';
    if (value && typeof value === 'object' && value.type === 'Buffer') {
      defaultValue = `(BLOB) ${value.data.length} bytes`;
    }

    return <Input defaultValue={defaultValue} readOnly style={{ width: '100%', ...style }} />;
  }

  if (GEOMETRY_TYPES.includes(pureType)) {
    let defaultValue: string = '';
    if (value && typeof value === 'object' && value.type !== 'Buffer') {
      defaultValue = mysqlSpatialToString(value);
    }

    return (
      <Input
        defaultValue={defaultValue}
        addonBefore="ST_GeomFromText('"
        addonAfter="')"
        onChange={e => handleChange(e.target.value)}
        style={{ width: '100%', ...style }}
      />
    );
  }
};

export default MySQLRawDataEditor;
