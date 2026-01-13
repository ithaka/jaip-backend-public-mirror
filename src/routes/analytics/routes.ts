import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas.js";
import { get_analytics_by_group_handler } from "./handlers.js";
import { get_route } from "../../utils/index.js";
import { analytics_prefix } from "./options.js";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.get_analytics;
  fastify.get(
    get_route(opts.schema),
    opts,
    get_analytics_by_group_handler(fastify),
  );
}

export default {
  routes,
  options: {
    prefix: analytics_prefix,
  },
};
