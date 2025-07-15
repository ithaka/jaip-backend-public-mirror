import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { restrict_handler, get_restricted_items_handler, unrestrict_handler } from "./handlers";
import { global_restricted_list_prefix } from "./options";
import { get_route } from "../../utils";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.get_restricted_items;
  fastify.post(get_route(opts.schema), opts, get_restricted_items_handler(fastify));

  opts.schema = route_schemas.restrict;
  fastify.post(get_route(opts.schema), opts, restrict_handler(fastify));

  opts.schema = route_schemas.unrestrict;
  fastify.post(get_route(opts.schema), opts, unrestrict_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: global_restricted_list_prefix,
  },
};
