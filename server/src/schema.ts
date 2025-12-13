import { mysqlTable, mysqlEnum, varchar, timestamp, datetime, int } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { EConnectionType } from '@packages/types/connection';

export const connectionsTable = mysqlTable('connections', {
  id: int().primaryKey().autoincrement(),
  type: mysqlEnum(EConnectionType).notNull(),
  name: varchar({ length: 50 }).notNull(),
  host: varchar({ length: 100 }).notNull(),
  port: int().notNull(),
  username: varchar({ length: 100 }),
  password: varchar({ length: 100 }),
  database: varchar({ length: 100 }),
  creator: int().notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow(),

  deletedAt: datetime('deletedAt', { mode: 'date' }).default(sql`NULL`),
});
