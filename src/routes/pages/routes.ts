import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { metadata_handler, page_handler } from "./handlers";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.metadata;
  fastify.get("/metadata/:iid", opts, metadata_handler(fastify));

  opts.schema = route_schemas.get_page;
  fastify.get("/page/:iid/:page", opts, page_handler(fastify));

  opts.schema = route_schemas.get_page;
  fastify.get("/page/:iid", opts, page_handler(fastify));
}

export default { routes, options: {} };
