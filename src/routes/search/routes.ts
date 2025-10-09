import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas.js";
import { search_handler, status_search_handler } from "./handlers.js";
import { search_prefix } from "./options.js";
import { get_route } from "../../utils/index.js";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.search;
  fastify.post(get_route(opts.schema), opts, search_handler(fastify, 0));

  opts.schema = route_schemas.status_search;
  fastify.post(get_route(opts.schema), opts, status_search_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: search_prefix,
  },
};
