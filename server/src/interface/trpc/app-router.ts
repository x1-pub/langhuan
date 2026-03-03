import { router } from '../../infra/trpc/factory';
import connectionRouter from '../../router/connection';
import databaseRouter from '../../router/database';
import tableRouter from '../../router/table';
import mysqlRouter from '../../router/mysql';
import redisRouter from '../../router/redis';
import mongodbRouter from '../../router/mongodb';
import pgsqlRouter from '../../router/pgsql';

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
