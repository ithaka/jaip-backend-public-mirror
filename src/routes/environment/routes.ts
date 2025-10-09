import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas.js";
import { environment_handler } from "./handlers.js";
import { environment_prefix } from "./options.js";
import { get_route } from "../../utils/index.js";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.get_environment;
  fastify.get(get_route(opts.schema), opts, environment_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: environment_prefix,
  },
};
