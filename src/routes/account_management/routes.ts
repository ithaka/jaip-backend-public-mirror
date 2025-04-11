import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import {
  add_or_edit_entities_handler,
  get_entities_handler,
  remove_entities_handler,
} from "./handlers";
import { entity_types } from "@prisma/client";
import { route_prefix } from "./options";
import { get_route } from "../../utils";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  // USERS
  opts.schema = route_schemas.get_users;
  fastify.post(
    get_route(opts.schema),
    opts,
    get_entities_handler(fastify, entity_types.users),
  );

  opts.schema = route_schemas.remove_users;
  fastify.delete(
    get_route(opts.schema),
    opts,
    remove_entities_handler(fastify, entity_types.users),
  );

  opts.schema = route_schemas.add_users;
  fastify.post(
    get_route(opts.schema),
    opts,
    add_or_edit_entities_handler(fastify, entity_types.users),
  );

  opts.schema = route_schemas.edit_users;
  fastify.patch(
    get_route(opts.schema),
    opts,
    add_or_edit_entities_handler(fastify, entity_types.users),
  );

  // FACILITIES
  opts.schema = route_schemas.get_facilities;
  fastify.post(
    get_route(opts.schema),
    opts,
    get_entities_handler(fastify, entity_types.facilities),
  );

  opts.schema = route_schemas.remove_facilities;
  fastify.delete(
    get_route(opts.schema),
    opts,
    remove_entities_handler(fastify, entity_types.facilities),
  );

  opts.schema = route_schemas.add_facilities;
  fastify.post(
    get_route(opts.schema),
    opts,
    add_or_edit_entities_handler(fastify, entity_types.facilities),
  );

  opts.schema = route_schemas.edit_facilities;
  fastify.patch(
    get_route(opts.schema),
    opts,
    add_or_edit_entities_handler(fastify, entity_types.facilities),
  );
}

export default {
  routes,
  options: {
    prefix: route_prefix,
  },
};
