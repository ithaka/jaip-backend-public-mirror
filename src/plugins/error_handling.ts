import fastify_plugin from "fastify-plugin";
import {
  FastifyError,
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface ErrorHandlerOptions {
  environment: string;
  errorHandler?: (
    err: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply,
  ) => void;
}

const errorHandlerPlugin: FastifyPluginAsync<ErrorHandlerOptions> =
  fastify_plugin(async (fastify: FastifyInstance) => {
    fastify.setErrorHandler((err, request, reply) => {
      fastify.log.error(err);
      fastify.eventLogger.pep_server_error(request, err);
      reply.status(err.statusCode || 500).send(err.message);
    });
  });

const options = { environment: process.env.NODE_ENV || "dev" };
const plugin = errorHandlerPlugin;

export default {
  options,
  plugin,
};
