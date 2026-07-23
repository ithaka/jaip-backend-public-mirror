import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas.js";
import { citations_handler } from "./handlers.js";
import { citations_prefix } from "./options.js";
import { get_route } from "../../utils/index.js";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.citations;
  fastify.get(get_route(opts.schema), opts, citations_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: citations_prefix,
  },
};
