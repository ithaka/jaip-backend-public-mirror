import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas.js";
import {
  add_ungrouped_feature_handler,
  delete_ungrouped_feature_handler,
  edit_ungrouped_feature_handler,
  get_ungrouped_features_handler,
  reactivate_ungrouped_feature_handler,
} from "./handlers.js";
import { ungrouped_features_prefix } from "./options.js";
import { get_route } from "../../../../utils/index.js";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.get_ungrouped_features;
  fastify.post(
    get_route(opts.schema),
    opts,
    get_ungrouped_features_handler(fastify),
  );

  opts.schema = route_schemas.add_ungrouped_feature;
  fastify.post(
    get_route(opts.schema),
    opts,
    add_ungrouped_feature_handler(fastify),
  );

  opts.schema = route_schemas.delete_ungrouped_feature;
  fastify.delete(
    get_route(opts.schema),
    opts,
    delete_ungrouped_feature_handler(fastify),
  );

  opts.schema = route_schemas.reactivate_ungrouped_feature;
  fastify.patch(
    get_route(opts.schema),
    opts,
    reactivate_ungrouped_feature_handler(fastify),
  );

  opts.schema = route_schemas.edit_ungrouped_feature;
  fastify.patch(
    get_route(opts.schema),
    opts,
    edit_ungrouped_feature_handler(fastify),
  );
}

export default {
  routes,
  options: {
    prefix: ungrouped_features_prefix,
  },
};
