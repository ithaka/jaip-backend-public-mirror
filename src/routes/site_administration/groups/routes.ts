import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas.js";
import {
  add_group_handler,
  clear_history_handler,
  create_group_admin_handler,
  delete_group_handler,
  edit_group_handler,
  get_groups_handler,
  reactivate_group_handler,
} from "./handlers.js";
import { groups_prefix } from "./options.js";
import { get_route } from "../../../utils/index.js";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.get_groups;
  fastify.post(get_route(opts.schema), opts, get_groups_handler(fastify));

  opts.schema = route_schemas.add_group;
  fastify.post(get_route(opts.schema), opts, add_group_handler(fastify));

  opts.schema = route_schemas.delete_group;
  fastify.delete(get_route(opts.schema), opts, delete_group_handler(fastify));

  opts.schema = route_schemas.reactivate_group;
  fastify.patch(
    get_route(opts.schema),
    opts,
    reactivate_group_handler(fastify),
  );

  opts.schema = route_schemas.edit_group;
  fastify.patch(get_route(opts.schema), opts, edit_group_handler(fastify));

  opts.schema = route_schemas.clear_history;
  fastify.delete(get_route(opts.schema), opts, clear_history_handler(fastify));

  opts.schema = route_schemas.create_group_admin;
  fastify.post(
    get_route(opts.schema),
    opts,
    create_group_admin_handler(fastify),
  );
}

export default {
  routes,
  options: {
    prefix: groups_prefix,
  },
};
