import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { alerts_handler } from "./handlers";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.alerts;
  fastify.get("/alerts", opts, alerts_handler(fastify));
}

export default { routes, options: {} };
