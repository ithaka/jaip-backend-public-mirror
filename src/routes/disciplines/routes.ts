import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { disciplines_handler } from "./handlers";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.disciplines;
  fastify.get("/disciplines", opts, disciplines_handler(fastify));

  opts.schema = route_schemas.journals;
  fastify.get("/disciplines/:code", opts, disciplines_handler(fastify));
}

export default routes;
