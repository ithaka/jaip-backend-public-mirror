import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { search_handler } from "./handlers";
import { search_prefix } from "./options";
import { get_route } from "../../utils";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.search;
  fastify.post(get_route(opts.schema), opts, search_handler(fastify, 0));
}

export default {
  routes,
  options: {
    prefix: search_prefix,
  },
};
