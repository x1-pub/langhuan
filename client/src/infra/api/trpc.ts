import { QueryCache, QueryClient } from '@tanstack/react-query';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';

import type { inferRouterOutputs, inferRouterInputs } from '@trpc/server';
import type { AppRouter } from '../../../../server/src/router';
import { showError } from '@/shared/ui/notifications';

const DEFAULT_ERROR_TITLE = 'UNEXPECTED_ERROR';
const DEFAULT_ERROR_MESSAGE = "I'm sorry, an unexpected error occurred on the server.";
const LOGIN_URL_HEADER = 'x-login-url';

let hasRedirectedToLogin = false;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const extractError = (error: unknown) => {
  let title = DEFAULT_ERROR_TITLE;
  let message = DEFAULT_ERROR_MESSAGE;
  let sql: string | undefined;

  if (isObject(error)) {
    const errorMessage = error.message;
    message = typeof errorMessage === 'string' ? errorMessage : DEFAULT_ERROR_MESSAGE;

    if (isObject(error.data)) {
      const dataCode = error.data.code;
      const dataSql = error.data.sql;

      if (typeof dataCode === 'string') {
        title = dataCode;
      }

      if (typeof dataSql === 'string') {
        sql = dataSql;
      }
    }
  }

  showError({ title, message, sql });
};

const trpcFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  if (!hasRedirectedToLogin && response.status === 401) {
    const loginUrl = response.headers.get(LOGIN_URL_HEADER);
    if (typeof window !== 'undefined' && loginUrl) {
      hasRedirectedToLogin = true;
      window.location.assign(loginUrl);
    }
  }

  return response;
};

export const trpcClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: '/api/trpc', fetch: trpcFetch })],
});

export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;

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
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
});
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
