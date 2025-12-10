import { z } from 'zod';

import { EConnectionType } from '../types/connection';

export const CreateConnectionSchema = z.object({
  type: z.enum(Object.values(EConnectionType)),
  name: z.string(),
  host: z.string(),
  port: z.int().min(1).max(65535),
  username: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  database: z.string().optional().nullable(),
});

export const ConnectionIdZod = z.object({
  id: z.int(),
});

export const UpdateConnectionSchema = CreateConnectionSchema.pick({
  name: true,
  host: true,
  port: true,
  username: true,
  database: true,
})
  .partial()
  .extend({
    id: z.int(),
  });

export const PingConnectionSchema = CreateConnectionSchema.pick({
  type: true,
  host: true,
  port: true,
  username: true,
  database: true,
  password: true,
}).extend({ id: z.int().optional() });

export const ExecuteCommandSchema = z.object({
  type: z.enum(Object.values(EConnectionType)),
  connectionId: z.int(),
  pageId: z.string(),
  command: z.string(),
});
