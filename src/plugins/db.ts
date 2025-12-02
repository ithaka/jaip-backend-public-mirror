import type { JAIPDatabase } from "../database/index.js";
import fp from "fastify-plugin";
import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyPluginOptions,
} from "fastify";
import { PrismaJAIPDatabase } from "../database/prisma.js";
import { PrismaClient } from "../database/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

// Use TypeScript module augmentation to declare the type of server.prisma to be PrismaClient
declare module "fastify" {
  interface FastifyInstance {
    db: JAIPDatabase;
  }
}

interface JAIPDatabasePluginOptions {
  db: JAIPDatabase;
}

const plugin: FastifyPluginAsync<JAIPDatabasePluginOptions> = fp(
  async (server: FastifyInstance, options: FastifyPluginOptions) => {
    server.decorate("db", options.db);
  },
);

const options = {
  db: new PrismaJAIPDatabase(
    new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
      }),
      log: [
        {
          emit: "event",
          level: "query",
        },
        {
          emit: "stdout",
          level: "error",
        },
        {
          emit: "stdout",
          level: "info",
        },
        {
          emit: "stdout",
          level: "warn",
        },
      ],
    }),
  ),
};

export default {
  options,
  plugin,
};
