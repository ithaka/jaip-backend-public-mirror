import logging from "./logging";
import errorHandlerPlugin from "./error_handling";
import { FastifyPluginAsync, FastifyPluginOptions } from "fastify";

const plugins: {
  [key: string]: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugin: FastifyPluginAsync<any>;
    options: FastifyPluginOptions;
  };
} = {
  errorHandlerPlugin,
  logging,
};

export default plugins;
