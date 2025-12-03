import { FastifyError, FastifyInstance, FastifyPluginAsync } from "fastify";
import fastify_plugin from "fastify-plugin";
import type { ErrorHandlerPluginOptions } from "../types/plugins.js";
import "dotenv/config";

const error_handler_plugin: FastifyPluginAsync<ErrorHandlerPluginOptions> =
  fastify_plugin(async (fastify: FastifyInstance) => {
    fastify.setErrorHandler((err: FastifyError, request, reply) => {
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
