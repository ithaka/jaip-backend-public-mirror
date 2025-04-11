import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { alerts_handler } from "./handlers";
import { alerts_prefix } from "./options";
import { get_route } from "../../utils";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.alerts;
  fastify.get(get_route(opts.schema), opts, alerts_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: alerts_prefix,
  },
};
