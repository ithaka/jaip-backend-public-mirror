import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { healthchecks_handler } from "./handlers";
import { get_route } from "../../utils";
import { healthcheck_prefix } from "./options";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.healthcheck;
  fastify.get(get_route(opts.schema), opts, healthchecks_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: healthcheck_prefix,
  },
};
