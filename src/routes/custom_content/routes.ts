import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas.js";
import { get_metadata_handler, pdf_handler } from "./handlers.js";
import { get_route } from "../../utils/index.js";
import { custom_content_prefix } from "./options.js";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.get_metadata;
  fastify.get(get_route(opts.schema), opts, get_metadata_handler(fastify));

  opts.schema = route_schemas.get_pdf;
  fastify.get(get_route(opts.schema), opts, pdf_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: custom_content_prefix,
  },
};
