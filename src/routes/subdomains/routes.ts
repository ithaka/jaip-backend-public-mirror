import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { subdomain_validation_handler } from "./handlers";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.subdomain;
  fastify.get(
    "/subdomains/validate",
    opts,
    subdomain_validation_handler(fastify),
  );
}

export default { routes, options: {} };
