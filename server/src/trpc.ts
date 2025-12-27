import { DatabaseError } from 'sequelize';
import { initTRPC, TRPCError } from '@trpc/server';

import createContext from './context';

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    let sql: string | undefined = undefined;

    if (error.cause instanceof DatabaseError) {
      sql = error.cause.sql;
    }

    return {
      ...shape,
      data: {
        ...shape.data,
        sql,
      },
    };
  },
});

export const router = t.router;
export const mergeRouters = t.mergeRouters;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async function isLogin(opts) {
  if (!opts.ctx.user.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication failed.' });
  }

  return opts.next({ ctx: { user: opts.ctx.user } });
});
