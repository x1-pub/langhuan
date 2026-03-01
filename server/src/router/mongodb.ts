import {
  AnalyzeMongoCollectionSchemaSchema,
  AggregateMongoCollectionSchema,
  CreateMongoCollectionIndexSchema,
  DeleteMongoCollectionIndexSchema,
  DeleteMongoDocumentsSchema,
  GetMongoCollectionDataSchema,
  InsertMongoDocumentSchema,
  MongoCollectionValidationSchema,
  MongoCollectionIndexesSchema,
  MongoCollectionStatsSchema,
  UpdateMongoCollectionValidationSchema,
  UpdateMongoDocumentSchema,
} from '@packages/zod/mongodb';
import { TRPCError } from '@trpc/server';
import { Connection } from 'mongoose';

import {
  normalizeMongoDocument,
  normalizeMongoValue,
  normalizeMongoId,
  parseMongoJsonArray,
  parseMongoJsonObject,
} from '../lib/mongodb';
import { protectedProcedure, router } from '../trpc';

// Shared helper to keep collection lookup and connection readiness checks consistent.
const getMongoCollection = async (
  getMongoDBlInstance: (
    connectionId: number,
    databaseName?: string,
    pageId?: string,
  ) => Promise<Connection>,
  input: {
    connectionId: number;
    dbName: string;
    tableName: string;
  },
) => {
  const instance = await getMongoDBlInstance(input.connectionId, input.dbName);

  if (!instance.db) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'MongoDB connection is not ready.',
    });
  }

  return instance.db.collection(input.tableName);
};

const getMongoDatabase = async (
  getMongoDBlInstance: (
    connectionId: number,
    databaseName?: string,
    pageId?: string,
  ) => Promise<Connection>,
  input: {
    connectionId: number;
    dbName: string;
  },
) => {
  const instance = await getMongoDBlInstance(input.connectionId, input.dbName);

  if (!instance.db) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'MongoDB connection is not ready.',
    });
  }

  return instance.db;
};

interface IMongoSchemaFieldAccumulator {
  count: number;
  typeCounts: Record<string, number>;
  examples: string[];
}

const shouldFallbackMongoSample = (error: unknown) => {
  const message = String(error || '').toLowerCase();
  return (
    message.includes('$sample') ||
    message.includes('unrecognized pipeline stage') ||
    message.includes('commandnotfound') ||
    message.includes('not supported')
  );
};

const getMongoValueType = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (Array.isArray(value)) {
    return 'array';
  }

  if (value instanceof Date) {
    return 'date';
  }

  if (Buffer.isBuffer(value)) {
    return 'binary';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return typeof value;
  }

  if (typeof value === 'object') {
    const bsonType = (value as { _bsontype?: string })._bsontype;
    if (bsonType) {
      const normalized = String(bsonType).toLowerCase();
      if (normalized === 'objectid') return 'objectId';
      if (normalized === 'decimal128') return 'decimal';
      if (normalized === 'int32' || normalized === 'long' || normalized === 'double') {
        return 'number';
      }
      if (normalized === 'timestamp') return 'timestamp';
      if (normalized === 'date') return 'date';
      if (normalized === 'binary') return 'binary';
    }

    return 'object';
  }

  return String(typeof value);
};

const formatSchemaExample = (value: unknown) => {
  const normalized = normalizeMongoValue(value);
  try {
    const str = JSON.stringify(normalized);
    if (str.length > 160) {
      return `${str.slice(0, 157)}...`;
    }
    return str;
  } catch {
    return String(normalized);
  }
};

const collectSchemaField = (
  fieldMap: Map<string, IMongoSchemaFieldAccumulator>,
  path: string,
  value: unknown,
) => {
  if (!path) {
    return;
  }

  const current =
    fieldMap.get(path) ||
    ({
      count: 0,
      typeCounts: {},
      examples: [],
    } as IMongoSchemaFieldAccumulator);

  const fieldType = getMongoValueType(value);
  current.count += 1;
  current.typeCounts[fieldType] = (current.typeCounts[fieldType] || 0) + 1;

  if (current.examples.length < 3) {
    current.examples.push(formatSchemaExample(value));
  }

  fieldMap.set(path, current);

  if (Array.isArray(value)) {
    value.forEach(item => collectSchemaField(fieldMap, `${path}[]`, item));
    return;
  }

  if (value && typeof value === 'object' && !Buffer.isBuffer(value) && !(value instanceof Date)) {
    Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
      collectSchemaField(fieldMap, `${path}.${key}`, nestedValue);
    });
  }
};

export const mongodbRouter = router({
  getCollectionData: protectedProcedure
    .input(GetMongoCollectionDataSchema)
    .query(async ({ ctx, input }) => {
      const filter = parseMongoJsonObject(input.filter, 'filter');
      const projection = parseMongoJsonObject(input.projection, 'projection');
      const sort = parseMongoJsonObject(input.sort, 'sort');
      // Keep backward compatibility with both legacy (limit/current) and new (pageSize/skip) paging params.
      const pageSize = input.limit ?? input.pageSize;
      const offset = input.skip ?? (input.current - 1) * pageSize;
      const collection = await getMongoCollection(ctx.pool.getMongoDBlInstance, input);

      const [count, list] = await Promise.all([
        collection.countDocuments(filter),
        collection
          .find(filter, { projection })
          .sort(sort as never)
          .skip(offset)
          .limit(pageSize)
          .toArray(),
      ]);

      return {
        count,
        pageSize,
        skip: offset,
        list: list.map(item => normalizeMongoDocument(item)),
      };
    }),

  insertDocument: protectedProcedure
    .input(InsertMongoDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      const document = parseMongoJsonObject(input.document, 'document');
      const collection = await getMongoCollection(ctx.pool.getMongoDBlInstance, input);
      const result = await collection.insertOne(document);

      return {
        insertedId: normalizeMongoDocument({ _id: result.insertedId })._id,
      };
    }),

  updateDocument: protectedProcedure
    .input(UpdateMongoDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      const document = parseMongoJsonObject(input.document, 'document');
      const collection = await getMongoCollection(ctx.pool.getMongoDBlInstance, input);
      const id = normalizeMongoId(input.id);

      // `_id` is immutable in MongoDB; remove it from replacement payload explicitly.
      delete document._id;
      const result = await collection.replaceOne({ _id: id } as never, document as never);

      if (result.matchedCount === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'The document to be updated does not exist.',
        });
      }

      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      };
    }),

  deleteDocuments: protectedProcedure
    .input(DeleteMongoDocumentsSchema)
    .mutation(async ({ ctx, input }) => {
      const collection = await getMongoCollection(ctx.pool.getMongoDBlInstance, input);
      const ids = input.ids.map(id => normalizeMongoId(id));
      const result = await collection.deleteMany({ _id: { $in: ids } } as never);

      return result.deletedCount;
    }),

  aggregateCollection: protectedProcedure
    .input(AggregateMongoCollectionSchema)
    .query(async ({ ctx, input }) => {
      const pipeline = parseMongoJsonArray(input.pipeline, 'pipeline');
      const collection = await getMongoCollection(ctx.pool.getMongoDBlInstance, input);
      const aggregateOptions: {
        allowDiskUse?: boolean;
        maxTimeMS?: number;
      } = {};

      if (input.allowDiskUse !== undefined) {
        aggregateOptions.allowDiskUse = input.allowDiskUse;
      }
      if (input.maxTimeMS !== undefined) {
        aggregateOptions.maxTimeMS = input.maxTimeMS;
      }

      const list = await collection.aggregate(pipeline as never, aggregateOptions).toArray();

      return list.map(item => normalizeMongoDocument(item));
    }),

  explainAggregateCollection: protectedProcedure
    .input(AggregateMongoCollectionSchema)
    .query(async ({ ctx, input }) => {
      const pipeline = parseMongoJsonArray(input.pipeline, 'pipeline');
      const collection = await getMongoCollection(ctx.pool.getMongoDBlInstance, input);
      const aggregateOptions: {
        allowDiskUse?: boolean;
        maxTimeMS?: number;
      } = {};

      if (input.allowDiskUse !== undefined) {
        aggregateOptions.allowDiskUse = input.allowDiskUse;
      }
      if (input.maxTimeMS !== undefined) {
        aggregateOptions.maxTimeMS = input.maxTimeMS;
      }

      const explainResult = await collection
        .aggregate(pipeline as never, aggregateOptions)
        .explain();

      return normalizeMongoDocument(explainResult);
    }),

  getCollectionIndexes: protectedProcedure
    .input(MongoCollectionIndexesSchema)
    .query(async ({ ctx, input }) => {
      const collection = await getMongoCollection(ctx.pool.getMongoDBlInstance, input);
      const indexes = await collection.indexes();

      return indexes.map(index => normalizeMongoDocument(index));
    }),

  getCollectionValidation: protectedProcedure
    .input(MongoCollectionValidationSchema)
    .query(async ({ ctx, input }) => {
      const db = await getMongoDatabase(ctx.pool.getMongoDBlInstance, input);
      const collectionOptions = await db
        .listCollections({ name: input.tableName }, { nameOnly: false })
        .toArray();
      const current = collectionOptions[0];

      if (!current) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Collection "${input.tableName}" does not exist.`,
        });
      }

      const options = (current.options || {}) as Record<string, unknown>;
      return normalizeMongoDocument({
        validator: options.validator || {},
        validationLevel: options.validationLevel || 'strict',
        validationAction: options.validationAction || 'error',
      });
    }),

  updateCollectionValidation: protectedProcedure
    .input(UpdateMongoCollectionValidationSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getMongoDatabase(ctx.pool.getMongoDBlInstance, input);
      const command: Record<string, unknown> = {
        collMod: input.tableName,
      };

      if (input.validator !== undefined) {
        command.validator = parseMongoJsonObject(input.validator, 'validator');
      }
      if (input.validationLevel !== undefined) {
        command.validationLevel = input.validationLevel;
      }
      if (input.validationAction !== undefined) {
        command.validationAction = input.validationAction;
      }

      if (Object.keys(command).length <= 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'At least one validation option must be provided.',
        });
      }

      await db.command(command);
      return null;
    }),

  analyzeCollectionSchema: protectedProcedure
    .input(AnalyzeMongoCollectionSchemaSchema)
    .query(async ({ ctx, input }) => {
      const collection = await getMongoCollection(ctx.pool.getMongoDBlInstance, input);
      const sampleSize = Math.max(10, Math.min(5000, input.sampleSize));
      let sampledDocuments: Record<string, unknown>[];
      try {
        sampledDocuments = await collection
          .aggregate<Record<string, unknown>>([{ $sample: { size: sampleSize } }])
          .toArray();
      } catch (error) {
        if (!shouldFallbackMongoSample(error)) {
          throw error;
        }

        sampledDocuments = await collection.find({}).limit(sampleSize).toArray();
      }
      const fieldMap = new Map<string, IMongoSchemaFieldAccumulator>();

      sampledDocuments.forEach(document => {
        Object.entries(document as Record<string, unknown>).forEach(([key, value]) => {
          collectSchemaField(fieldMap, key, value);
        });
      });

      const fields = Array.from(fieldMap.entries())
        .map(([path, stats]) => {
          const types = Object.entries(stats.typeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => ({
              type,
              count,
            }));
          const coverage = sampledDocuments.length
            ? Number(((stats.count / sampledDocuments.length) * 100).toFixed(2))
            : 0;

          return {
            path,
            count: stats.count,
            coverage,
            required: sampledDocuments.length > 0 && stats.count === sampledDocuments.length,
            types,
            examples: stats.examples,
          };
        })
        .sort((a, b) => {
          if (a.path === '_id') return -1;
          if (b.path === '_id') return 1;
          if (a.count !== b.count) return b.count - a.count;
          return a.path.localeCompare(b.path);
        });

      return {
        requestedSampleSize: sampleSize,
        sampledCount: sampledDocuments.length,
        fieldCount: fields.length,
        fields,
      };
    }),

  createCollectionIndex: protectedProcedure
    .input(CreateMongoCollectionIndexSchema)
    .mutation(async ({ ctx, input }) => {
      const keys = parseMongoJsonObject(input.keys, 'keys');
      const options = parseMongoJsonObject(input.options, 'options');
      const collection = await getMongoCollection(ctx.pool.getMongoDBlInstance, input);
      const indexName = await collection.createIndex(keys as never, options as never);

      return indexName;
    }),

  deleteCollectionIndex: protectedProcedure
    .input(DeleteMongoCollectionIndexSchema)
    .mutation(async ({ ctx, input }) => {
      // MongoDB always requires the built-in `_id_` index.
      if (input.indexName === '_id_') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'The _id index is built-in and cannot be removed.',
        });
      }

      const collection = await getMongoCollection(ctx.pool.getMongoDBlInstance, input);
      await collection.dropIndex(input.indexName);

      return null;
    }),

  getCollectionStats: protectedProcedure
    .input(MongoCollectionStatsSchema)
    .query(async ({ ctx, input }) => {
      const instance = await ctx.pool.getMongoDBlInstance(input.connectionId, input.dbName);
      if (!instance.db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'MongoDB connection is not ready.',
        });
      }

      const collection = instance.db.collection(input.tableName);
      const [stats, count, estimated] = await Promise.all([
        instance.db.command({ collStats: input.tableName }),
        // Exact count (filter-aware) can be slower but authoritative.
        collection.countDocuments({}),
        // Estimated count is faster for large collections and useful for quick overview.
        collection.estimatedDocumentCount(),
      ]);

      return {
        ...normalizeMongoDocument(stats),
        count,
        estimatedCount: estimated,
      };
    }),
});

export default mongodbRouter;
