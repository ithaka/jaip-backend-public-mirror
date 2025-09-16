import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import {
  add_alert_handler,
  delete_alert_handler,
  edit_alert_handler,
  get_alerts_handler,
} from "./handlers";
import { groups_prefix } from "./options";
import { get_route } from "../../utils/index";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.get_alerts;
  fastify.get(get_route(opts.schema), opts, get_alerts_handler(fastify));

  opts.schema = route_schemas.get_paginated_alerts;
  fastify.post(get_route(opts.schema), opts, get_alerts_handler(fastify));

  opts.schema = route_schemas.add_alert;
  fastify.post(get_route(opts.schema), opts, add_alert_handler(fastify));

  opts.schema = route_schemas.delete_alert;
  fastify.delete(get_route(opts.schema), opts, delete_alert_handler(fastify));

  opts.schema = route_schemas.edit_alert;
  fastify.patch(get_route(opts.schema), opts, edit_alert_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: groups_prefix,
  },
};
