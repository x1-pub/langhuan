import cors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import Fastify from 'fastify';
import dotenv from 'dotenv';
import path from 'path';

import createContext from './context';
import { appRouter } from './router';

dotenv.config({ path: path.join(__dirname, `../.env.${process.env.NODE_ENV}`) });

const fastify = Fastify({ logger: false });

async function main() {
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

  await fastify.listen({ port: 7209 });
}

main();
