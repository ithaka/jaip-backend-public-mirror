import logging from "./logging";
import errorHandlerPlugin from "./error_handling";
import { FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import database from "./database";

const plugins: {
  [key: string]: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugin: FastifyPluginAsync<any>;
    options: FastifyPluginOptions;
  };
} = {
  errorHandlerPlugin,
  logging,
  database,
};

export default plugins;
