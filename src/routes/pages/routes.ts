import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { metadata_handler, page_handler } from "./handlers";
import { get_route } from "../../utils";
import { pages_prefix } from "./options";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.metadata;
  fastify.get(get_route(opts.schema), opts, metadata_handler(fastify));

  opts.schema = route_schemas.get_page;
  fastify.get(get_route(opts.schema), opts, page_handler(fastify));

  opts.schema = route_schemas.get_pdf;
  fastify.get(get_route(opts.schema), opts, page_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: pages_prefix,
  },
};
