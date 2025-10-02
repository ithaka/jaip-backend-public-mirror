import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { liveness_handler, readiness_handler } from "./handlers";
import { get_route } from "../../utils";
import { healthcheck_prefix } from "./options";

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
