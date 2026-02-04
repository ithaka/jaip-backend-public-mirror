import fastify_plugin from "fastify-plugin";
import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyPluginOptions,
} from "fastify";
import { ServiceDiscoveryPluginOptions } from "../types/plugins.js";
import { JSTORInstance, JSTORInstanceError } from "../types/services.js";
import axios from "axios";
import { ensure_error } from "../utils/index.js";

declare module "fastify" {
  interface FastifyInstance {
    discover(service: string): Promise<[string, Error | null]>;
  }
}

const discovery_handler = async function (
  service: string,
): Promise<[string, Error | null]> {
  const url = `http://localhost:8888/v1/apps/${service}/instances/next`;
  try {
    console.log("Attempting service discovery for", service);
    const {
      data,
      status,
    }: { data: JSTORInstance | JSTORInstanceError; status: number } =
      await axios.get(url);
    if (status !== 200) {
      const msg =
        "error" in data
          ? data.error
          : "Service discovery failed: Status code not 200";
      throw new Error(msg);
    }
    console.log(data);
    if ("homePageUrl" in data) {
      return [data.homePageUrl, null];
    } else {
      throw new Error("Service discovery failed: No instances found");
    }
  } catch (err) {
    const error = ensure_error(err);
    return ["", error];
  }
};
const service_discovery_plugin: FastifyPluginAsync<ServiceDiscoveryPluginOptions> =
  fastify_plugin(
    async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
      fastify.decorate("discover", options.discover);
    },
  );

const options = {
  discover: discovery_handler,
};

const plugin = service_discovery_plugin;

export default {
  options,
  plugin,
};
