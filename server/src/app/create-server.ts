import cors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import Fastify from 'fastify';

import createContext from '../infra/trpc/context';
import { appRouter } from '../interface/trpc/app-router';
import { loadServerEnv } from '../infra/config/load-env';

loadServerEnv();

const resolveServerPort = () => {
  const port = Number(process.env.SERVER_PORT || 7209);
  if (Number.isInteger(port) && port > 0 && port <= 65535) {
    return port;
  }

  return 7209;
};

const resolveCorsOrigins = () => {
  const rawOrigins = process.env.CORS_ORIGINS?.trim();
  if (!rawOrigins) {
    return true;
  }

  const origins = rawOrigins
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  if (!origins.length || origins.includes('*')) {
    return true;
  }

  return origins;
};

export const createHttpServer = () => {
  const fastify = Fastify({ logger: true });

  const start = async () => {
    await fastify.register(cors, {
      credentials: true,
      origin: resolveCorsOrigins(),
    });

    fastify.get('/health', async () => ({
      status: 'ok',
      uptime: Number(process.uptime().toFixed(2)),
      timestamp: new Date().toISOString(),
    }));

    await fastify.register(fastifyTRPCPlugin, {
      prefix: '/api/trpc',
      trpcOptions: {
        router: appRouter,
        createContext,
      },
    });

    await fastify.listen({
      host: process.env.SERVER_HOST || '0.0.0.0',
      port: resolveServerPort(),
    });
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
