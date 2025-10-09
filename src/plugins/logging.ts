import fastify_plugin from "fastify-plugin";
import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyPluginOptions,
} from "fastify";
import { EventLogger } from "../event_handler/index.js";
import { CaptainsLogger } from "../event_handler/captains_logger/index.js";
import { EventLoggerPluginOptions } from "../types/plugins.js";
declare module "fastify" {
  interface FastifyInstance {
    event_logger: EventLogger;
  }
}

const event_logger_plugin: FastifyPluginAsync<EventLoggerPluginOptions> =
  fastify_plugin(
    async (server: FastifyInstance, options: FastifyPluginOptions) => {
      server.decorate("event_logger", options.event_logger);
    },
  );

const options = {
  event_logger: new CaptainsLogger(),
};

const plugin = event_logger_plugin;

export default {
  options,
  plugin,
};
