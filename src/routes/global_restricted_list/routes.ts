import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas.js";
import {
  restrict_handler,
  get_restricted_items_handler,
  unrestrict_handler,
  download_handler,
  get_last_updated_handler,
} from "./handlers.js";
import { global_restricted_list_prefix } from "./options.js";
import { get_route } from "../../utils/index.js";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.get_restricted_items;
  fastify.post(
    get_route(opts.schema),
    opts,
    get_restricted_items_handler(fastify),
  );

  opts.schema = route_schemas.restrict;
  fastify.post(get_route(opts.schema), opts, restrict_handler(fastify));

  opts.schema = route_schemas.unrestrict;
  fastify.post(get_route(opts.schema), opts, unrestrict_handler(fastify));

  opts.schema = route_schemas.download_restricted_items;
  fastify.get(get_route(opts.schema), opts, download_handler(fastify));

  opts.schema = route_schemas.get_last_updated;
  fastify.get(get_route(opts.schema), opts, get_last_updated_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: global_restricted_list_prefix,
  },
};
