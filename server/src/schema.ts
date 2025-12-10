import { mysqlTable, mysqlEnum, varchar, timestamp, int } from 'drizzle-orm/mysql-core';

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
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp(),
});
