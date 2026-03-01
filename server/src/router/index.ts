import { router } from '../trpc';
import connectionRouter from './connection';
import databaseRouter from './database';
import tableRouter from './table';
import mysqlRouter from './mysql';
import redisRouter from './redis';
import mongodbRouter from './mongodb';
import pgsqlRouter from './pgsql';

export const appRouter = router({
  connection: connectionRouter,
  database: databaseRouter,
  table: tableRouter,
  mysql: mysqlRouter,
  pgsql: pgsqlRouter,
  redis: redisRouter,
  mongodb: mongodbRouter,
});

export type AppRouter = typeof appRouter;
