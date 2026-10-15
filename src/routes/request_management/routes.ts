import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas.js";
import {
  add_request_permissions_handler,
  delete_request_permissions_handler,
  edit_request_permissions_handler,
} from "./handlers.js";
import { groups_prefix } from "./options.js";
import { get_route } from "../../utils/index.js";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.add_request_permissions;
  fastify.post(
    get_route(opts.schema),
    opts,
    add_request_permissions_handler(fastify),
  );

  opts.schema = route_schemas.delete_request_permissions;
  fastify.delete(
    get_route(opts.schema),
    opts,
    delete_request_permissions_handler(fastify),
  );

  opts.schema = route_schemas.edit_request_permissions;
  fastify.patch(
    get_route(opts.schema),
    opts,
    edit_request_permissions_handler(fastify),
  );
}

export default {
  routes,
  options: {
    prefix: groups_prefix,
  },
};
