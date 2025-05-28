import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { logging_handler } from "./handlers";
import { subdomains_prefix } from "./options";
import { get_route } from "../../utils";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.logging;
  fastify.post(
    get_route(opts.schema),
    opts,
    logging_handler(fastify),
  );
}

export default {
  routes,
  options: {
    prefix: subdomains_prefix,
  },
};
