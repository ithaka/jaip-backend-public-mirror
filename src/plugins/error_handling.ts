import fastify_plugin from "fastify-plugin";
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import type { ErrorHandlerPluginOptions } from "../types/plugins";

const error_handler_plugin: FastifyPluginAsync<ErrorHandlerPluginOptions> =
  fastify_plugin(async (fastify: FastifyInstance) => {
    fastify.setErrorHandler((err, request, reply) => {
      fastify.event_logger.pep_server_error(request, err);
      reply.status(err.statusCode || 500).send(err.message);
    });
  });

const options = { environment: process.env.ENVIRONMENT || "dev" };
const plugin = error_handler_plugin;

export default {
  options,
  plugin,
};
