import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import {
  add_subdomain_handler,
  delete_subdomain_handler,
  edit_subdomain_handler,
  get_subdomains_handler,
  reactivate_subdomain_handler,
} from "./handlers";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.get_subdomains;
  fastify.post("/subdomains/get", opts, get_subdomains_handler(fastify));

  opts.schema = route_schemas.add_subdomain;
  fastify.post("/subdomains", opts, add_subdomain_handler(fastify));

  opts.schema = route_schemas.delete_subdomain;
  fastify.delete("/subdomains", opts, delete_subdomain_handler(fastify));

  opts.schema = route_schemas.reactivate_subdomain;
  fastify.patch(
    "/subdomains/reactivate",
    opts,
    reactivate_subdomain_handler(fastify),
  );

  opts.schema = route_schemas.edit_subdomain;
  fastify.patch("/subdomains", opts, edit_subdomain_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: "/site_administration",
  },
};
