import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas.js";
import { download_offline_index_handler } from "./handlers.js";
import { downloads_prefix } from "./options.js";
import { get_route } from "../../utils/index.js";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.download_offline_index;
  fastify.get(
    get_route(opts.schema),
    opts,
    download_offline_index_handler(fastify),
  );
}

export default {
  routes,
  options: {
    prefix: downloads_prefix,
  },
};
