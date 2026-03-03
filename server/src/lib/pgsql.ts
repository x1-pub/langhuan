import { TRPCError } from '@trpc/server';

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_$]*$/;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Object.prototype.toString.call(value) === '[object Object]';
};

export const quotePgsqlIdentifier = (identifier: string, fieldName = 'identifier') => {
  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Invalid ${fieldName}: ${identifier}`,
    });
  }

  return `"${identifier.replace(/"/g, '""')}"`;
};

export const parsePgsqlQualifiedTableName = (rawTableName: string) => {
  const parts = rawTableName.split('.');

  if (parts.length > 2 || parts.length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Invalid table name: ${rawTableName}`,
    });
  }

  const schemaName = parts.length === 2 ? parts[0] : 'public';
  const tableName = parts.length === 2 ? parts[1] : parts[0];

  return {
    schemaName,
    tableName,
    quotedSchemaName: quotePgsqlIdentifier(schemaName, 'schema'),
    quotedTableName: quotePgsqlIdentifier(tableName, 'table'),
  };
};

export const parsePgsqlJsonObject = (raw: string, fieldName: string): Record<string, unknown> => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${fieldName} must be valid JSON.`,
    });
  }

  if (!isPlainObject(parsed)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${fieldName} must be a JSON object.`,
    });
  }

  return parsed;
};

export const validatePgsqlSqlFragment = (fragment: string | undefined, fieldName: string) => {
  if (!fragment?.trim()) {
    return '';
  }

  if (fragment.includes(';') || fragment.includes('\u0000')) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${fieldName} contains unsupported characters.`,
    });
  }

  if (fragment.includes('--') || fragment.includes('/*') || fragment.includes('*/')) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${fieldName} does not allow comments.`,
    });
  }

  return fragment.trim();
};

export const normalizePgsqlValue = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Buffer.isBuffer(value)) {
    return value.toString('base64');
  }

  if (Array.isArray(value)) {
    return value.map(item => normalizePgsqlValue(item));
  }

  if (typeof value === 'object') {
    const normalized: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      normalized[key] = normalizePgsqlValue(item);
    });
    return normalized;
  }

  return value;
};

export const normalizePgsqlRow = (row: Record<string, unknown>) => {
  const normalized: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    normalized[key] = normalizePgsqlValue(value);
  });
  return normalized;
};
