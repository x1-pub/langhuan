import { mergeRouters } from '../../trpc';
import mysqlOthersRouter from './others';
import mysqlFunctionsRouter from './functions';
import mysqlDataRouter from './data';
import mysqlColumnRouter from './column';
import mysqlTriggersRouter from './triggers';
import mysqlIndexesRouter from './indexes';

const mysqlRouter = mergeRouters(
  mysqlFunctionsRouter,
  mysqlDataRouter,
  mysqlColumnRouter,
  mysqlTriggersRouter,
  mysqlIndexesRouter,
  mysqlOthersRouter,
);

export default mysqlRouter;
