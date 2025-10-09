import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas.js";
import { auth_session_handler } from "./handlers.js";
import { auth_prefix } from "./options.js";
import { get_route } from "../../utils/index.js";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.auth;
  fastify.get(get_route(opts.schema), opts, auth_session_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: auth_prefix,
  },
};
