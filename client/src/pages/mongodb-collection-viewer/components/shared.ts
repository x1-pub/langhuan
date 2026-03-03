import type { RouterOutput } from '@/infra/api/trpc';

export const ROW_KEY_FIELD = '__mongo_row_key';
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_QUERY_STATE = {
  filter: '{}',
  projection: '{}',
  sort: '{"_id": -1}',
  limit: DEFAULT_PAGE_SIZE,
  skip: 0,
};
export const DEFAULT_DOCUMENT = '{\n  \n}';
export const DEFAULT_PIPELINE = '[\n  {\n    "$match": {}\n  }\n]';
export const DEFAULT_VALIDATION =
  '{\n  "$jsonSchema": {\n    "bsonType": "object",\n    "required": [],\n    "properties": {}\n  }\n}';

export type TActiveTab =
  | 'documents'
  | 'aggregations'
  | 'indexes'
  | 'validation'
  | 'schema'
  | 'stats';
export type TDocumentViewMode = 'table' | 'list' | 'json';
export type TAggregationViewMode = 'table' | 'json';

export type TMongoDocument = RouterOutput['mongodb']['getCollectionData']['list'][number];
export type TMongoIndex = RouterOutput['mongodb']['getCollectionIndexes'][number];
export type TMongoStats = RouterOutput['mongodb']['getCollectionStats'];
export type TMongoValidation = RouterOutput['mongodb']['getCollectionValidation'];
export type TMongoSchemaAnalysis = RouterOutput['mongodb']['analyzeCollectionSchema'];

export interface IMongoTableRow extends Record<string, unknown> {
  _id?: unknown;
  __mongo_row_key: string;
}

export interface IAggregationTableRow extends Record<string, unknown> {
  __mongo_row_key: string;
}

export interface IDocumentEditorState {
  mode: 'create' | 'edit';
  id?: unknown;
  content: string;
}

export interface IIndexEditorState {
  keys: string;
  options: string;
}

export interface IDocumentQueryState {
  filter: string;
  projection: string;
  sort: string;
  limit: number;
  skip: number;
}

export type TListValueType =
  | 'objectId'
  | 'string'
  | 'date'
  | 'number'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'summary'
  | 'plain';

export interface IListValue {
  text: string;
  type: TListValueType;
}

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === 'object' && !Array.isArray(value);
};

export const formatMongoValue = (value: unknown): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const isObjectIdString = (value: string) => /^[a-f\d]{24}$/i.test(value);

export const isIsoDateString = (value: string) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) && !Number.isNaN(Date.parse(value));

export const isExpandableValue = (value: unknown) => {
  return (Array.isArray(value) && value.length >= 0) || isPlainObject(value);
};

export const getObjectEntries = (value: Record<string, unknown>): [string, unknown][] => {
  const entries = Object.entries(value);
  const idEntry = entries.find(([key]) => key === '_id');
  const otherEntries = entries.filter(([key]) => key !== '_id');
  return idEntry ? [idEntry, ...otherEntries] : otherEntries;
};

const summarizeValue = (value: unknown): IListValue => {
  if (Array.isArray(value)) {
    return {
      text: `Array (${value.length})`,
      type: 'summary',
    };
  }

  if (isPlainObject(value)) {
    const size = Object.keys(value).length;
    return {
      text: size === 0 ? 'Object (empty)' : 'Object',
      type: 'summary',
    };
  }

  if (value === null) {
    return { text: 'null', type: 'null' };
  }
  if (value === undefined) {
    return { text: 'undefined', type: 'undefined' };
  }
  if (typeof value === 'boolean') {
    return { text: String(value), type: 'boolean' };
  }
  if (typeof value === 'number') {
    return { text: String(value), type: 'number' };
  }
  if (typeof value === 'string') {
    if (isIsoDateString(value)) {
      return { text: value, type: 'date' };
    }
    return { text: `"${value}"`, type: 'string' };
  }

  return { text: formatMongoValue(value), type: 'plain' };
};

export const formatListValue = (fieldName: string, value: unknown): IListValue => {
  if (fieldName === '_id' && typeof value === 'string' && isObjectIdString(value)) {
    return {
      text: `ObjectId('${value}')`,
      type: 'objectId',
    };
  }

  return summarizeValue(value);
};

export const formatBytes = (size: unknown): string => {
  if (typeof size !== 'number' || Number.isNaN(size) || size < 0) {
    return '-';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'];
  let next = size / 1024;
  let unitIndex = 0;

  while (next >= 1024 && unitIndex < units.length - 1) {
    next /= 1024;
    unitIndex += 1;
  }

  return `${next.toFixed(2)} ${units[unitIndex]}`;
};

export const encodeRowKey = (id: unknown, index: number, prefix: string): string => {
  if (id === undefined) {
    return `${prefix}_row_${index}`;
  }

  try {
    return `${prefix}_${JSON.stringify(id)}`;
  } catch {
    return `${prefix}_row_${index}_${String(id)}`;
  }
};
