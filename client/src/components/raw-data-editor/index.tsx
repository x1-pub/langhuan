import React from 'react';
import dayjs from 'dayjs';
import { Buffer } from 'buffer';
import { DatePicker, Input, InputNumber, Select } from 'antd';

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

const MYSQL_DATE_PICKER_PICKER_MAP = {
  [EMySQLPureType.TIME]: 'time',
  [EMySQLPureType.DATE]: 'date',
  [EMySQLPureType.YEAR]: 'year',
  [EMySQLPureType.TIMESTAMP]: 'date',
  [EMySQLPureType.DATETIME]: 'date',
} as const satisfies Record<
  | EMySQLPureType.TIME
  | EMySQLPureType.DATE
  | EMySQLPureType.YEAR
  | EMySQLPureType.TIMESTAMP
  | EMySQLPureType.DATETIME,
  'time' | 'date' | 'year'
>;

const MYSQL_DATE_PICKER_FORMAT_MAP = {
  [EMySQLPureType.TIME]: 'HH:mm:ss',
  [EMySQLPureType.DATE]: 'YYYY-MM-DD',
  [EMySQLPureType.YEAR]: 'YYYY',
  [EMySQLPureType.TIMESTAMP]: 'YYYY-MM-DD HH:mm:ss',
  [EMySQLPureType.DATETIME]: 'YYYY-MM-DD HH:mm:ss',
} as const;

interface RawDataEditorProps {
  engine?: TEngine;
  type: string;
  value?: unknown;
  style?: React.CSSProperties;
  onChange?: (value: unknown) => void;
}

const isPgsqlNumberType = (type: string) => {
  const lower = type.toLowerCase();
  return (
    lower.includes('int') ||
    lower.includes('numeric') ||
    lower.includes('decimal') ||
    lower.includes('real') ||
    lower.includes('double') ||
    lower.includes('serial')
  );
};

const isPgsqlBooleanType = (type: string) => {
  const lower = type.toLowerCase();
  return lower === 'boolean' || lower === 'bool';
};

const isPgsqlJsonType = (type: string) => {
  const lower = type.toLowerCase();
  return lower.includes('json');
};

const isPgsqlTimestampType = (type: string) => {
  return type.toLowerCase().includes('timestamp');
};

const isPgsqlTimestampWithTimeZoneType = (type: string) => {
  const lower = type.toLowerCase();
  return lower === 'timestamptz' || lower.includes('timestamp with time zone');
};

const isPgsqlDateType = (type: string) => {
  return type.toLowerCase().startsWith('date');
};

const isPgsqlTimeType = (type: string) => {
  return type.toLowerCase().startsWith('time');
};

const isPgsqlTimeWithTimeZoneType = (type: string) => {
  const lower = type.toLowerCase();
  return lower === 'timetz' || lower.includes('time with time zone');
};

const normalizeSqlDateInput = (value: string) => {
  return value
    .trim()
    .replace('T', ' ')
    .replace(/\.\d+/, '')
    .replace(/(Z|[+-]\d{2}:?\d{2})$/, '')
    .trim();
};

const normalizeSqlTimeInput = (value: string) => {
  return value
    .trim()
    .replace(/^2000-01-01\s+/i, '')
    .replace(/\.\d+/, '')
    .replace(/(Z|[+-]\d{2}:?\d{2})$/, '')
    .trim();
};

const formatDateToPickerInput = (value: Date, pureType: EMySQLPureType) => {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  const hour = String(value.getUTCHours()).padStart(2, '0');
  const minute = String(value.getUTCMinutes()).padStart(2, '0');
  const second = String(value.getUTCSeconds()).padStart(2, '0');

  if (pureType === EMySQLPureType.YEAR) {
    return String(year);
  }
  if (pureType === EMySQLPureType.DATE) {
    return `${year}-${month}-${day}`;
  }
  if (pureType === EMySQLPureType.TIME) {
    return `${hour}:${minute}:${second}`;
  }

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const renderMysqlEditor = (
  type: string,
  value: unknown,
  style: React.CSSProperties | undefined,
  onChange: ((value: unknown) => void) | undefined,
) => {
  const pureType = getMySQLPureType(type);

  const handleChange = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) {
      onChange?.(null);
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
    const normalizedValue =
      value instanceof Date
        ? formatDateToPickerInput(value, pureType)
        : typeof value === 'string'
          ? pureType === EMySQLPureType.TIME
            ? normalizeSqlTimeInput(value)
            : normalizeSqlDateInput(value)
          : String(value || '');
    const defaultValue = value
      ? dayjs(pureType === EMySQLPureType.TIME ? `2000-01-01 ${normalizedValue}` : normalizedValue)
      : undefined;
    const format =
      MYSQL_DATE_PICKER_FORMAT_MAP[pureType as keyof typeof MYSQL_DATE_PICKER_FORMAT_MAP];
    const pickerType =
      MYSQL_DATE_PICKER_PICKER_MAP[pureType as keyof typeof MYSQL_DATE_PICKER_PICKER_MAP];

    return (
      <DatePicker
        defaultValue={defaultValue}
        onChange={newValue => handleChange(newValue?.format(format))}
        showTime={[EMySQLPureType.TIMESTAMP, EMySQLPureType.DATETIME].includes(pureType)}
        format={format}
        picker={pickerType}
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
      value && typeof value === 'object' ? JSON.stringify(value) : String(value || '');

    return (
      <Input.TextArea
        defaultValue={defaultValue}
        onChange={e => handleChange(e.target.value)}
        style={{ width: '100%', ...style }}
      />
    );
  }

  if (EMySQLPureType.BIT === pureType) {
    let defaultValue = '';
    const rawValue = value as TMySQLRawData | undefined;
    if (rawValue && typeof rawValue === 'object' && rawValue.type === 'Buffer') {
      const buffer = Buffer.from(rawValue.data);
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
    const rawValue = value as TMySQLRawData | undefined;
    if (rawValue && typeof rawValue === 'object' && rawValue.type === 'Buffer') {
      buffer = rawValue.data;
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
    let defaultValue = '';
    const rawValue = value as TMySQLRawData | undefined;
    if (rawValue && typeof rawValue === 'object' && rawValue.type === 'Buffer') {
      defaultValue = `(BLOB) ${rawValue.data.length} bytes`;
    }

    return (
      <Input defaultValue={defaultValue} readOnly={true} style={{ width: '100%', ...style }} />
    );
  }

  if (GEOMETRY_TYPES.includes(pureType)) {
    let defaultValue = '';
    const rawValue = value as TMySQLRawData | undefined;
    if (rawValue && typeof rawValue === 'object' && rawValue.type !== 'Buffer') {
      defaultValue = mysqlSpatialToString(rawValue);
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

  return (
    <Input
      defaultValue={value as string}
      onChange={e => handleChange(e.target.value)}
      style={{ width: '100%', ...style }}
    />
  );
};

const renderPgsqlEditor = (
  type: string,
  value: unknown,
  style: React.CSSProperties | undefined,
  onChange: ((value: unknown) => void) | undefined,
) => {
  if (isPgsqlBooleanType(type)) {
    return (
      <Select
        value={typeof value === 'boolean' ? value : undefined}
        allowClear={true}
        options={[
          { label: 'true', value: true },
          { label: 'false', value: false },
        ]}
        onChange={next => onChange?.(next)}
        style={{ width: '100%', ...style }}
      />
    );
  }

  if (isPgsqlNumberType(type)) {
    const defaultValue =
      value === null || value === undefined || value === '' ? undefined : Number(value);
    return (
      <InputNumber
        value={Number.isNaN(defaultValue as number) ? undefined : defaultValue}
        onChange={next => onChange?.(next)}
        style={{ width: '100%', ...style }}
      />
    );
  }

  if (isPgsqlTimestampType(type) || isPgsqlDateType(type) || isPgsqlTimeType(type)) {
    const isTimeZoneAware =
      isPgsqlTimestampWithTimeZoneType(type) || isPgsqlTimeWithTimeZoneType(type);

    if (isTimeZoneAware) {
      return (
        <Input
          value={value === null || value === undefined ? '' : String(value)}
          onChange={e => onChange?.(e.target.value)}
          style={{ width: '100%', ...style }}
        />
      );
    }

    const format = isPgsqlTimestampType(type)
      ? 'YYYY-MM-DD HH:mm:ss'
      : isPgsqlDateType(type)
        ? 'YYYY-MM-DD'
        : 'HH:mm:ss';
    const normalizedValue =
      value instanceof Date
        ? isPgsqlTimeType(type)
          ? formatDateToPickerInput(value, EMySQLPureType.TIME)
          : isPgsqlDateType(type)
            ? formatDateToPickerInput(value, EMySQLPureType.DATE)
            : formatDateToPickerInput(value, EMySQLPureType.DATETIME)
        : typeof value === 'string'
          ? isPgsqlTimeType(type)
            ? normalizeSqlTimeInput(value)
            : normalizeSqlDateInput(value)
          : undefined;
    const parsedValue =
      typeof normalizedValue === 'string'
        ? dayjs(isPgsqlTimeType(type) ? `2000-01-01 ${normalizedValue}` : normalizedValue)
        : undefined;
    const picker = isPgsqlTimeType(type) ? 'time' : isPgsqlDateType(type) ? 'date' : 'date';

    return (
      <DatePicker
        showTime={isPgsqlTimestampType(type)}
        picker={picker}
        format={format}
        value={parsedValue && parsedValue.isValid() ? parsedValue : undefined}
        onChange={next => onChange?.(next ? next.format(format) : null)}
        style={{ width: '100%', ...style }}
      />
    );
  }

  if (isPgsqlJsonType(type)) {
    const defaultValue =
      typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || '');

    return (
      <Input.TextArea
        value={defaultValue}
        onChange={e => {
          const next = e.target.value;
          try {
            onChange?.(JSON.parse(next));
          } catch {
            onChange?.(next);
          }
        }}
        autoSize={{ minRows: 2, maxRows: 6 }}
        style={{ width: '100%', ...style }}
      />
    );
  }

  return (
    <Input
      value={value === null || value === undefined ? '' : String(value)}
      onChange={e => onChange?.(e.target.value)}
      style={{ width: '100%', ...style }}
    />
  );
};

const RawDataEditor: React.FC<RawDataEditorProps> = ({
  engine = 'mysql',
  type,
  value,
  style,
  onChange,
}) => {
  if (engine === 'pgsql') {
    return renderPgsqlEditor(type, value, style, onChange);
  }

  return renderMysqlEditor(type, value, style, onChange);
};

export default RawDataEditor;
