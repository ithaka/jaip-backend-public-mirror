import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import {
  add_or_edit_entities_handler,
  get_entities_handler,
  remove_entities_handler,
} from "./handlers";
import { entity_types } from "@prisma/client";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  // Get entities
  opts.schema = route_schemas.get_users;
  fastify.post(
    "/entities/get/users",
    opts,
    get_entities_handler(fastify, entity_types.users),
  );
  opts.schema = route_schemas.get_facilities;
  fastify.post(
    "/entities/get/facilities",
    opts,
    get_entities_handler(fastify, entity_types.facilities),
  );

  // Remove entities
  opts.schema = route_schemas.remove_users;
  fastify.delete(
    "/entities/users",
    opts,
    remove_entities_handler(fastify, entity_types.users),
  );
  opts.schema = route_schemas.remove_facilities;
  fastify.delete(
    "/entities/facilities",
    opts,
    remove_entities_handler(fastify, entity_types.facilities),
  );

  // Add entities
  opts.schema = route_schemas.add_users;
  fastify.post(
    "/entities/users",
    opts,
    add_or_edit_entities_handler(fastify, entity_types.users),
  );

  opts.schema = route_schemas.add_facilities;
  fastify.post(
    "/entities/facilities",
    opts,
    add_or_edit_entities_handler(fastify, entity_types.facilities),
  );

  // Edit entities
  opts.schema = route_schemas.edit_users;
  fastify.patch(
    "/entities/users",
    opts,
    add_or_edit_entities_handler(fastify, entity_types.users),
  );

  opts.schema = route_schemas.edit_facilities;
  fastify.patch(
    "/entities/facilities",
    opts,
    add_or_edit_entities_handler(fastify, entity_types.facilities),
  );
}

export default { routes, options: {} };
