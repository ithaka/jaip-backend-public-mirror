import logging from "./logging";
import { FastifyPluginAsync, FastifyPluginOptions } from "fastify";

const plugins: {
  [key: string]: {
    plugin: FastifyPluginAsync<any>;
    options: FastifyPluginOptions;
  };
} = {
  logging,
};

export default plugins;
