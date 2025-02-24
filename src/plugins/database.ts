import fp from "fastify-plugin";
import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyPluginOptions,
} from "fastify";
import { PrismaClient } from "@prisma/client";

// Use TypeScript module augmentation to declare the type of server.prisma to be PrismaClient
declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const plugin: FastifyPluginAsync = fp(
  async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    const prisma = new PrismaClient();
    console.log(options);
    await prisma.$connect();

    // Make Prisma Client available through the fastify server instance: fastify.prisma
    fastify.decorate("prisma", prisma);
    fastify.addHook("onClose", async (fastify) => {
      await fastify.prisma.$disconnect();
    });
  },
);

const options = {};

export default {
  options,
  plugin,
};
