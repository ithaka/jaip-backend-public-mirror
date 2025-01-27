import { FastifyPluginOptions } from "fastify";
export interface EventLoggerPluginOptions extends FastifyPluginOptions {
  eventLogger: EventLogger;
}
