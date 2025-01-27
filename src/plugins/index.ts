import logging from "./logging";
import errorHandlerPlugin from "./error_handling";
import { FastifyPluginAsync, FastifyPluginOptions } from "fastify";

const plugins: {
  [key: string]: {
    plugin: FastifyPluginAsync<any>;
    options: FastifyPluginOptions;
  };
} = {
  logging,
  errorHandlerPlugin,
};

export default plugins;
