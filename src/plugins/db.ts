import type { JAIPDatabase } from "../database";
import fp from "fastify-plugin";
import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyPluginOptions,
} from "fastify";
import { PrismaJAIPDatabase } from "../database/prisma";
import { PrismaClient } from "@prisma/client";

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
  db: new PrismaJAIPDatabase(new PrismaClient()),
};

export default {
  options,
  plugin,
};
