import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { disciplines_handler } from "./handlers";
import { disciplines_prefix } from "./options";
import { get_route } from "../../utils/get_route";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.disciplines;
  fastify.get(
    get_route(route_schemas.disciplines),
    opts,
    disciplines_handler(fastify),
  );

  opts.schema = route_schemas.journals;
  fastify.get(
    get_route(route_schemas.journals),
    opts,
    disciplines_handler(fastify),
  );
}

export default {
  routes,
  options: {
    prefix: disciplines_prefix,
  },
};
