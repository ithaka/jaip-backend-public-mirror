import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas.js";
import { dictionary_prefix } from "./options.js";
import { get_route } from "../../utils/index.js";
import { headwords_search_handler, word_search_handler } from "./handlers.js";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.headword_search;
  fastify.get(get_route(opts.schema), opts, headwords_search_handler(fastify));

  opts.schema = route_schemas.word_search;
  fastify.get(get_route(opts.schema), opts, word_search_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: dictionary_prefix,
  },
};
