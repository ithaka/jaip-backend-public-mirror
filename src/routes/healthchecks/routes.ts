import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas.js";
import { liveness_handler, readiness_handler } from "./handlers.js";
import { get_route } from "../../utils/index.js";
import { healthcheck_prefix } from "./options.js";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.liveness;
  fastify.get(get_route(opts.schema), opts, liveness_handler(fastify));

  opts.schema = route_schemas.readiness;
  fastify.get(get_route(opts.schema), opts, readiness_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: healthcheck_prefix,
  },
};
