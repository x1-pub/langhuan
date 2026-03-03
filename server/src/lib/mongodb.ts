import { TRPCError } from '@trpc/server';
import { Types } from 'mongoose';

// Collection name used to bootstrap/init a database when no business collection exists yet.
export const MONGODB_PLACEHOLDER_COLLECTION = '__langhuan_init__';

// Strictly checks plain JSON objects and excludes arrays/classes.
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Object.prototype.toString.call(value) === '[object Object]';
};

/**
 * Recursively revives MongoDB extended JSON into driver-native values.
 * Example: { "$oid": "..." } -> ObjectId, { "$date": "..." } -> Date.
 * The optional key allows `_id` string payloads to be cast automatically.
 */
export const reviveMongoSpecialTypes = (value: unknown, key?: string): unknown => {
  if (Array.isArray(value)) {
    return value.map(item => reviveMongoSpecialTypes(item, key));
  }

  if (isPlainObject(value)) {
    if (typeof value.$oid === 'string' && Types.ObjectId.isValid(value.$oid)) {
      return new Types.ObjectId(value.$oid);
    }

    if (value.$date) {
      const parsedDate = new Date(String(value.$date));
      if (!Number.isNaN(parsedDate.valueOf())) {
        return parsedDate;
      }
    }

    const normalized: Record<string, unknown> = {};
    Object.entries(value).forEach(([childKey, childValue]) => {
      normalized[childKey] = reviveMongoSpecialTypes(childValue, childKey);
    });

    return normalized;
  }

  if (key === '_id' && typeof value === 'string' && Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value);
  }

  return value;
};

// Parses JSON object input and revives Mongo-specific literals.
export const parseMongoJsonObject = (
  raw: string | undefined,
  fieldName: string,
): Record<string, unknown> => {
  if (!raw?.trim()) {
    return {};
  }

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

  const normalized = reviveMongoSpecialTypes(parsed);
  if (!isPlainObject(normalized)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${fieldName} must be a JSON object.`,
    });
  }

  return normalized;
};

// Parses JSON array input and revives Mongo-specific literals.
export const parseMongoJsonArray = (raw: string, fieldName: string): unknown[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${fieldName} must be valid JSON.`,
    });
  }

  if (!Array.isArray(parsed)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${fieldName} must be a JSON array.`,
    });
  }

  const normalized = reviveMongoSpecialTypes(parsed);
  if (!Array.isArray(normalized)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${fieldName} must be a JSON array.`,
    });
  }

  return normalized;
};

/**
 * Normalizes Mongo/BSON values into JSON-serializable values for API responses.
 * This keeps the frontend payload deterministic across different BSON types.
 */
export const normalizeMongoValue = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(item => normalizeMongoValue(item));
  }

  if (value instanceof Types.ObjectId) {
    return value.toHexString();
  }

  if (Buffer.isBuffer(value)) {
    return value.toString('base64');
  }

  if (value instanceof Map) {
    const normalizedMap: Record<string, unknown> = {};
    value.forEach((mapValue, mapKey) => {
      normalizedMap[String(mapKey)] = normalizeMongoValue(mapValue);
    });

    return normalizedMap;
  }

  if (typeof value === 'object') {
    // BSON driver objects expose their runtime type via `_bsontype`.
    const bsonType = (value as { _bsontype?: string })._bsontype;

    if (bsonType === 'ObjectId') {
      return String(value);
    }

    if (
      bsonType === 'Decimal128' ||
      bsonType === 'Long' ||
      bsonType === 'Int32' ||
      bsonType === 'Double' ||
      bsonType === 'Timestamp'
    ) {
      return String(value);
    }

    if (bsonType === 'Binary') {
      const binaryBuffer = (value as { buffer?: Uint8Array }).buffer;
      return binaryBuffer ? Buffer.from(binaryBuffer).toString('base64') : String(value);
    }

    const normalizedObject: Record<string, unknown> = {};
    Object.entries(value).forEach(([objKey, objValue]) => {
      normalizedObject[objKey] = normalizeMongoValue(objValue);
    });

    return normalizedObject;
  }

  return String(value);
};

// Ensures the top-level response is always an object for stable UI consumption.
export const normalizeMongoDocument = (value: unknown): Record<string, unknown> => {
  const normalized = normalizeMongoValue(value);

  if (isPlainObject(normalized)) {
    return normalized;
  }

  return {
    value: normalized,
  };
};

// Normalizes id payloads so string/ObjectId formats are both accepted.
export const normalizeMongoId = (id: unknown): unknown => {
  return reviveMongoSpecialTypes(id, '_id');
};
