import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas.js";
import {
  add_subdomain_handler,
  delete_subdomain_handler,
  edit_subdomain_handler,
  get_subdomains_handler,
  reactivate_subdomain_handler,
} from "./handlers.js";
import { subdomains_prefix } from "./options.js";
import { get_route } from "../../../utils/index.js";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.get_subdomains;
  fastify.post(get_route(opts.schema), opts, get_subdomains_handler(fastify));

  opts.schema = route_schemas.add_subdomain;
  fastify.post(get_route(opts.schema), opts, add_subdomain_handler(fastify));

  opts.schema = route_schemas.delete_subdomain;
  fastify.delete(
    get_route(opts.schema),
    opts,
    delete_subdomain_handler(fastify),
  );

  opts.schema = route_schemas.reactivate_subdomain;
  fastify.patch(
    get_route(opts.schema),
    opts,
    reactivate_subdomain_handler(fastify),
  );

  opts.schema = route_schemas.edit_subdomain;
  fastify.patch(get_route(opts.schema), opts, edit_subdomain_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: subdomains_prefix,
  },
};
