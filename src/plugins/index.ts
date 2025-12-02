import logging from "./logging.js";
import errorHandlerPlugin from "./error_handling.js";
import { FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import service_discovery from "./service_discovery.js";
import db from "./db.js";

const plugins: {
  [key: string]: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugin: FastifyPluginAsync<any>;
    options: FastifyPluginOptions;
  };
} = {
  errorHandlerPlugin,
  logging,
  service_discovery,
  db,
};

export default plugins;
