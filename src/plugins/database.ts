import fastify_plugin from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@prisma/client";

// Use TypeScript module augmentation to declare the type of server.prisma to be PrismaClient
declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const plugin: FastifyPluginAsync = fastify_plugin(async (fastify, options) => {
  const prisma = new PrismaClient(options);
  if (!process.env.DB_MOCK) {
    await prisma.$connect();
  }

  // prisma.$on(
  //   // @ts-expect-error Prisma typing doesn't seem to work for the event emitter
  //   "query",
  //   (e: { query: string; params: string; duration: number }) => {
  //     console.log("Query: " + e.query);
  //     console.log("Params: " + e.params);
  //     console.log("Duration: " + e.duration + "ms");
  //   },
  // );

  // Make Prisma Client available through the fastify server instance: fastify.prisma
  fastify.decorate("prisma", prisma);
  fastify.addHook("onClose", async (fastify) => {
    if (!process.env.DB_MOCK) await fastify.prisma.$disconnect();
  });
});

const options = {
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
};

export default {
  options,
  plugin,
};
