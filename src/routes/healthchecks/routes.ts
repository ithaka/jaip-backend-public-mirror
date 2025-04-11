import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { healthchecks_handler } from "./handlers";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.healthcheck;
  fastify.get("/healthcheck", opts, healthchecks_handler(fastify));
}

export default { routes, options: {} };
