import fastify_plugin from "fastify-plugin";
import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyPluginOptions,
} from "fastify";
import { EventLogger } from "../event_handler";
import { CaptainsLogger } from "../event_handler/captains_logger";
import { EventLoggerPluginOptions } from "../types/plugins";
declare module "fastify" {
  interface FastifyInstance {
    eventLogger: EventLogger;
  }
}

const event_logger_plugin: FastifyPluginAsync<EventLoggerPluginOptions> =
  fastify_plugin(
    async (server: FastifyInstance, options: FastifyPluginOptions) => {
      server.decorate("eventLogger", options.eventLogger);
    },
  );

const options = {
  eventLogger: new CaptainsLogger(),
};

const plugin = event_logger_plugin;

export default {
  options,
  plugin,
};
