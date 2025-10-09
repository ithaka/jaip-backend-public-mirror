import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas.js";
import {
  add_group_feature_handler,
  delete_group_feature_handler,
  edit_group_feature_handler,
  get_group_features_handler,
  reactivate_group_feature_handler,
} from "./handlers.js";
import { grouped_features_prefix } from "./options.js";
import { get_route } from "../../../../utils/index.js";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.get_group_features;
  fastify.post(
    get_route(opts.schema),
    opts,
    get_group_features_handler(fastify),
  );

  opts.schema = route_schemas.add_group_feature;
  fastify.post(
    get_route(opts.schema),
    opts,
    add_group_feature_handler(fastify),
  );

  opts.schema = route_schemas.delete_group_feature;
  fastify.delete(
    get_route(opts.schema),
    opts,
    delete_group_feature_handler(fastify),
  );

  opts.schema = route_schemas.reactivate_group_feature;
  fastify.patch(
    get_route(opts.schema),
    opts,
    reactivate_group_feature_handler(fastify),
  );

  opts.schema = route_schemas.edit_group_feature;
  fastify.patch(
    get_route(opts.schema),
    opts,
    edit_group_feature_handler(fastify),
  );
}

export default {
  routes,
  options: {
    prefix: grouped_features_prefix,
  },
};
