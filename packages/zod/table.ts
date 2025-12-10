import { z } from 'zod';

import { BaseDatabaseSchema } from './database';

export const BaseTableSchema = BaseDatabaseSchema.extend({
  dbName: z.string(),
});

export const CreateTableSchema = BaseTableSchema.extend({
  tableName: z.string(),
  comment: z.string().optional(),
});

export const UpdateTableSchema = BaseTableSchema.extend({
  tableName: z.string(),
  newTableName: z.string(),
  comment: z.string().optional(),
});

export const DeleteTableSchema = BaseTableSchema.extend({
  tableName: z.string(),
});
