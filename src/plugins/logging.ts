import fastifyPlugin from "fastify-plugin";
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

const eventLoggerPlugin: FastifyPluginAsync<EventLoggerPluginOptions> =
  fastifyPlugin(
    async (server: FastifyInstance, options: FastifyPluginOptions) => {
      server.decorate("eventLogger", options.eventLogger);
    },
  );

const options = {
  eventLogger: new CaptainsLogger(),
};

const plugin = eventLoggerPlugin;

export default {
  options,
  plugin,
};
