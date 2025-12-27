import { mergeRouters } from '../../trpc';
import mysqlOthersRouter from './others';
import mysqlFunctionsRouter from './functions';
import mysqlDataRouter from './data';
import mysqlColumnRouter from './column';
import mysqlTriggersRouter from './triggers';
import mysqlIndexesRouter from './indexes';
import mysqlEventsRouter from './events';
import mysqlViewsRouter from './views';

const mysqlRouter = mergeRouters(
  mysqlFunctionsRouter,
  mysqlDataRouter,
  mysqlColumnRouter,
  mysqlTriggersRouter,
  mysqlIndexesRouter,
  mysqlEventsRouter,
  mysqlViewsRouter,
  mysqlOthersRouter,
);

export default mysqlRouter;
