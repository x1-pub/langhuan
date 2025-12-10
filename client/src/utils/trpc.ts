import { QueryCache, QueryClient } from '@tanstack/react-query';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';

import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../../server/src/router';
import { showError } from './global-notification';

export const trpcClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: 'http://localhost:7209/trpc' })],
});

export type RouterOutput = inferRouterOutputs<AppRouter>;
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: error => {
      showError(error.message);
    },
  }),
  defaultOptions: {
    mutations: {
      onError(error) {
        showError(error.message);
      },
    },
  },
});
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
