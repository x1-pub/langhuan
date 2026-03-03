import cors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import Fastify from 'fastify';

import createContext from '../infra/trpc/context';
import { appRouter } from '../interface/trpc/app-router';

export const createHttpServer = () => {
  const fastify = Fastify({ logger: true });

  const start = async () => {
    await fastify.register(cors, {
      credentials: true,
      origin: true,
    });

    await fastify.register(fastifyTRPCPlugin, {
      prefix: '/api/trpc',
      trpcOptions: {
        router: appRouter,
        createContext,
      },
    });

    await fastify.listen({ host: '0.0.0.0', port: 7209 });
  };

  return {
    fastify,
    start,
  };
};

export const startHttpServer = async () => {
  const server = createHttpServer();
  await server.start();
};
