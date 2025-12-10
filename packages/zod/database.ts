import { z } from 'zod';

import { EConnectionType } from '../types/connection';

export const BaseDatabaseSchema = z.object({
  type: z.enum(Object.values(EConnectionType)),
  connectionId: z.int(),
});

export const CreateOrUpdateDatabaseSchema = BaseDatabaseSchema.extend({
  dbName: z.string(),
  charset: z.string().optional(),
  collation: z.string().optional(),
});

export const DeleteDatabaseSchema = BaseDatabaseSchema.extend({
  dbName: z.string(),
});
