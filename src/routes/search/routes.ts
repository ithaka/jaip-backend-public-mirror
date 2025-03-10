import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { search_handler, status_search_handler } from "./handlers";
import { StatusParams } from "../../types/routes";
import { SearchRequest } from "../../types/search";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.search;
  fastify.post("/search", opts, search_handler(fastify, 0));

  opts.schema = route_schemas.status_search;
  fastify.post<{ Params: StatusParams; Body: SearchRequest }>(
    "/search/:status",
    opts,
    status_search_handler(fastify),
  );
}

export default routes;
