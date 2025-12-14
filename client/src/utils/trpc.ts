import { QueryCache, QueryClient } from '@tanstack/react-query';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { createTRPCClient, httpBatchLink, TRPCClientErrorLike } from '@trpc/client';

import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../../server/src/router';
import { showError } from './global-notification';

const extractError = (error: unknown) => {
  const trpcError = error as TRPCClientErrorLike<AppRouter>;

  const title = trpcError.data?.code || 'UNEXPECTED_ERROR';
  const message = trpcError.message || "I'm sorry, an unexpected error occurred on the server.";
  const sql = trpcError.data?.sql;

  showError({ title, message, sql });
};

// export const trpcClient = createTRPCClient<AppRouter>({
//   links: [httpBatchLink({ url: '/api/trpc' })],
// });

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      fetch: async (input, init) => {
        const res = await fetch(input, init);

        if (res.status === 401) {
          const headerLoginUrl = res.headers.get('X-Login-Url');

          if (!headerLoginUrl) {
            return res;
          }

          window.location.href = headerLoginUrl;
        }

        return res;
      },
    }),
  ],
});

export type RouterOutput = inferRouterOutputs<AppRouter>;
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: extractError,
  }),
  defaultOptions: {
    mutations: {
      retry: 0,
      onError: extractError,
    },
    queries: {
      retry: 0,
    },
  },
});
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
