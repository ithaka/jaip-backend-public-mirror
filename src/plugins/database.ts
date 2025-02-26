import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@prisma/client";

// Use TypeScript module augmentation to declare the type of server.prisma to be PrismaClient
declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const plugin: FastifyPluginAsync = fp(async (fastify, options) => {
  const prisma = new PrismaClient(options);
  if (!process.env.DB_MOCK) {
    await prisma.$connect();
  }

  // Make Prisma Client available through the fastify server instance: fastify.prisma
  fastify.decorate("prisma", prisma);
  fastify.addHook("onClose", async (fastify) => {
    if (!process.env.DB_MOCK) await fastify.prisma.$disconnect();
  });
});

const options = {
  // log: ["query", "info", "warn", "error"],
};

export default {
  options,
  plugin,
};
