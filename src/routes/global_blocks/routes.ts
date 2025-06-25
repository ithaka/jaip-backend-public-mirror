import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { block_handler, get_blocked_items_handler, unblock_handler } from "./handlers";
import { global_blocks_prefix } from "./options";
import { get_route } from "../../utils";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.get_blocked_items;
  fastify.post(get_route(opts.schema), opts, get_blocked_items_handler(fastify));

  opts.schema = route_schemas.block;
  fastify.post(get_route(opts.schema), opts, block_handler(fastify));

  opts.schema = route_schemas.unblock;
  fastify.post(get_route(opts.schema), opts, unblock_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: global_blocks_prefix,
  },
};
