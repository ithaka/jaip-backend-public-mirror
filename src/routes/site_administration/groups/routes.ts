import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import {
  add_group_handler,
  clear_history_handler,
  create_group_admin_handler,
  delete_group_handler,
  edit_group_handler,
  get_groups_handler,
  reactivate_group_handler,
} from "./handlers";
import { groups_prefix } from "./options";
import { get_route } from "../../../utils";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.get_groups;
  fastify.post(
    get_route(route_schemas.get_groups),
    opts,
    get_groups_handler(fastify),
  );

  opts.schema = route_schemas.add_group;
  fastify.post(
    get_route(route_schemas.add_group),
    opts,
    add_group_handler(fastify),
  );

  opts.schema = route_schemas.delete_group;
  fastify.delete(
    get_route(route_schemas.delete_group),
    opts,
    delete_group_handler(fastify),
  );

  opts.schema = route_schemas.reactivate_group;
  fastify.patch(
    get_route(route_schemas.reactivate_group),
    opts,
    reactivate_group_handler(fastify),
  );

  opts.schema = route_schemas.edit_group;
  fastify.patch(
    get_route(route_schemas.edit_group),
    opts,
    edit_group_handler(fastify),
  );

  opts.schema = route_schemas.clear_history;
  fastify.delete(
    get_route(route_schemas.clear_history),
    opts,
    clear_history_handler(fastify),
  );

  opts.schema = route_schemas.create_group_admin;
  fastify.post(
    get_route(route_schemas.create_group_admin),
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
