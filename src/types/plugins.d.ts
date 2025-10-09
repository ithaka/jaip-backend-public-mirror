import { FastifyPluginOptions } from "fastify";
import { JAIPDatabase } from "../database/index.js";
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

export interface ServiceDiscoveryPluginOptions extends FastifyPluginOptions {
  discover(service: string): Promise<[string, Error | null]>;
}

export interface JAIPDatabasePluginOptions extends FastifyPluginOptions {
  db: JAIPDatabase;
}
