import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { DiscParams } from "../../types/routes";
import { disciplines_handler } from "./handlers";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.disciplines;
  fastify.get<{ Params: DiscParams }>(
    "/disciplines",
    opts,
    disciplines_handler(fastify),
  );

  opts.schema = route_schemas.journals;
  fastify.get<{ Params: DiscParams }>(
    "/disciplines/:code",
    opts,
    disciplines_handler(fastify),
  );
}

export default routes;
