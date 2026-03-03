import { z } from 'zod';

export const PgsqlBaseSchema = z.object({
  connectionId: z.int(),
  dbName: z.string(),
  tableName: z.string(),
});

export const PgsqlDatabaseBaseSchema = z.object({
  connectionId: z.int(),
  dbName: z.string(),
});

export const GetPgsqlTableDataSchema = PgsqlBaseSchema.extend({
  current: z.int().min(1).default(1),
  pageSize: z.int().min(1).max(500).default(50),
  where: z.string().optional(),
  orderBy: z.string().optional(),
});

export const InsertPgsqlRowSchema = PgsqlBaseSchema.extend({
  row: z.string(),
});

export const UpdatePgsqlRowSchema = PgsqlBaseSchema.extend({
  ctid: z.string().min(1),
  row: z.string(),
});

export const DeletePgsqlRowsSchema = PgsqlBaseSchema.extend({
  ctids: z.array(z.string().min(1)).min(1),
});

export const GetPgsqlTableColumnsSchema = PgsqlBaseSchema;

export const CreatePgsqlTableColumnSchema = PgsqlBaseSchema.extend({
  name: z.string().min(1),
  dataType: z.string().min(1),
  nullable: z.boolean().default(true),
  defaultValue: z.string().optional(),
  comment: z.string().optional(),
});

export const UpdatePgsqlTableColumnSchema = PgsqlBaseSchema.extend({
  oldName: z.string().min(1),
  name: z.string().min(1),
  dataType: z.string().min(1),
  nullable: z.boolean().default(true),
  defaultValue: z.string().optional(),
  comment: z.string().optional(),
});

export const DeletePgsqlTableColumnSchema = PgsqlBaseSchema.extend({
  name: z.string().min(1),
});

export const GetPgsqlTableIndexesSchema = PgsqlBaseSchema;

export const CreatePgsqlTableIndexSchema = PgsqlBaseSchema.extend({
  indexName: z.string().min(1),
  columns: z.array(z.string().min(1)).min(1),
  unique: z.boolean().optional(),
  method: z.string().optional(),
});

export const DropPgsqlTableIndexSchema = PgsqlBaseSchema.extend({
  indexName: z.string().min(1),
});

export const UpdatePgsqlTableIndexSchema = PgsqlBaseSchema.extend({
  oldName: z.string().min(1),
  indexName: z.string().min(1),
  columns: z.array(z.string().min(1)).min(1),
  unique: z.boolean().optional(),
  method: z.string().optional(),
});

export const GetPgsqlTableDDLSchema = PgsqlBaseSchema;

export const GetPgsqlTableStatsSchema = PgsqlBaseSchema;

export const GetPgsqlFunctionsSchema = PgsqlDatabaseBaseSchema;

export const CreatePgsqlFunctionSchema = PgsqlDatabaseBaseSchema.extend({
  definition: z.string().min(1),
});

export const UpdatePgsqlFunctionSchema = PgsqlDatabaseBaseSchema.extend({
  definition: z.string().min(1),
});

export const DeletePgsqlFunctionSchema = PgsqlDatabaseBaseSchema.extend({
  schemaName: z.string().min(1),
  name: z.string().min(1),
  arguments: z.string().optional(),
  kind: z.string().optional(),
});

export const GetPgsqlViewsSchema = PgsqlDatabaseBaseSchema;

export const CreatePgsqlViewSchema = PgsqlDatabaseBaseSchema.extend({
  schemaName: z.string().min(1),
  name: z.string().min(1),
  definition: z.string().min(1),
  comment: z.string().optional(),
});

export const UpdatePgsqlViewSchema = PgsqlDatabaseBaseSchema.extend({
  oldSchemaName: z.string().min(1),
  oldName: z.string().min(1),
  schemaName: z.string().min(1),
  name: z.string().min(1),
  definition: z.string().min(1),
  comment: z.string().optional(),
});

export const DeletePgsqlViewSchema = PgsqlDatabaseBaseSchema.extend({
  schemaName: z.string().min(1),
  name: z.string().min(1),
});

export const GetPgsqlEventTriggersSchema = PgsqlDatabaseBaseSchema;

export const CreatePgsqlEventTriggerSchema = PgsqlDatabaseBaseSchema.extend({
  definition: z.string().min(1),
});

export const UpdatePgsqlEventTriggerSchema = PgsqlDatabaseBaseSchema.extend({
  oldName: z.string().min(1),
  definition: z.string().min(1),
});

export const DeletePgsqlEventTriggerSchema = PgsqlDatabaseBaseSchema.extend({
  name: z.string().min(1),
});

export const GetPgsqlTableTriggersSchema = PgsqlBaseSchema;

export const CreatePgsqlTableTriggerSchema = PgsqlBaseSchema.extend({
  definition: z.string().min(1),
});

export const UpdatePgsqlTableTriggerSchema = PgsqlBaseSchema.extend({
  oldName: z.string().min(1),
  definition: z.string().min(1),
});

export const DeletePgsqlTableTriggerSchema = PgsqlBaseSchema.extend({
  name: z.string().min(1),
});

export const GetPgsqlTablePartitionsSchema = PgsqlBaseSchema;

export const CreatePgsqlTablePartitionSchema = PgsqlBaseSchema.extend({
  partitionName: z.string().min(1),
  definition: z.string().min(1),
});

export const UpdatePgsqlTablePartitionSchema = PgsqlBaseSchema.extend({
  oldName: z.string().min(1),
  partitionName: z.string().min(1),
  definition: z.string().min(1),
});

export const DeletePgsqlTablePartitionSchema = PgsqlBaseSchema.extend({
  name: z.string().min(1),
});
