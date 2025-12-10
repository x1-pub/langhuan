import { initTRPC, TRPCError } from '@trpc/server';
import createContext from './context';

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape }) {
    return {
      code: shape.code,
      message: shape.message,
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async function isLogin(opts) {
  if (!opts.ctx.user.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return opts.next({ ctx: { user: opts.ctx.user } });
});
