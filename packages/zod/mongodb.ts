import { z } from 'zod';

export const MongoCollectionBaseSchema = z.object({
  connectionId: z.int(),
  dbName: z.string(),
  tableName: z.string(),
});

export const GetMongoCollectionDataSchema = MongoCollectionBaseSchema.extend({
  current: z.int().min(1).default(1),
  pageSize: z.int().min(1).max(500).default(20),
  limit: z.int().min(1).max(500).optional(),
  skip: z.int().min(0).optional(),
  filter: z.string().optional(),
  projection: z.string().optional(),
  sort: z.string().optional(),
});

export const InsertMongoDocumentSchema = MongoCollectionBaseSchema.extend({
  document: z.string(),
});

export const UpdateMongoDocumentSchema = MongoCollectionBaseSchema.extend({
  id: z.unknown(),
  document: z.string(),
});

export const DeleteMongoDocumentsSchema = MongoCollectionBaseSchema.extend({
  ids: z.array(z.unknown()).min(1),
});

export const AggregateMongoCollectionSchema = MongoCollectionBaseSchema.extend({
  pipeline: z.string(),
  allowDiskUse: z.boolean().optional(),
  maxTimeMS: z.int().min(1).max(600000).optional(),
});

export const MongoCollectionIndexesSchema = MongoCollectionBaseSchema;

export const CreateMongoCollectionIndexSchema = MongoCollectionBaseSchema.extend({
  keys: z.string(),
  options: z.string().optional(),
});

export const DeleteMongoCollectionIndexSchema = MongoCollectionBaseSchema.extend({
  indexName: z.string(),
});

export const MongoCollectionStatsSchema = MongoCollectionBaseSchema;

export const MongoCollectionValidationSchema = MongoCollectionBaseSchema;

export const UpdateMongoCollectionValidationSchema = MongoCollectionBaseSchema.extend({
  validator: z.string().optional(),
  validationLevel: z.enum(['off', 'strict', 'moderate']).optional(),
  validationAction: z.enum(['error', 'warn']).optional(),
});

export const AnalyzeMongoCollectionSchemaSchema = MongoCollectionBaseSchema.extend({
  sampleSize: z.int().min(10).max(5000).default(200),
});
