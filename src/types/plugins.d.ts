import { FastifyPluginOptions } from "fastify";
export interface EventLoggerPluginOptions extends FastifyPluginOptions {
  event_logger: EventLogger;
}

export interface ErrorHandlerPluginOptions extends FastifyPluginOptions {
  environment: string;
  errorHandler?: (
    err: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply,
  ) => void;
}
