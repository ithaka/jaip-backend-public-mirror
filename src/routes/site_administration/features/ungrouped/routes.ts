import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import {
  add_ungrouped_feature_handler,
  delete_ungrouped_feature_handler,
  edit_ungrouped_feature_handler,
  get_ungrouped_features_handler,
  reactivate_ungrouped_feature_handler,
} from "./handlers";
import { ungrouped_features_prefix } from "./options";
import { get_route } from "../../../../utils";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.get_ungrouped_features;
  fastify.post(
    get_route(route_schemas.get_ungrouped_features),
    opts,
    get_ungrouped_features_handler(fastify),
  );

  opts.schema = route_schemas.add_ungrouped_feature;
  fastify.post(
    get_route(route_schemas.add_ungrouped_feature),
    opts,
    add_ungrouped_feature_handler(fastify),
  );

  opts.schema = route_schemas.delete_ungrouped_feature;
  fastify.delete(
    get_route(route_schemas.delete_ungrouped_feature),
    opts,
    delete_ungrouped_feature_handler(fastify),
  );

  opts.schema = route_schemas.reactivate_ungrouped_feature;
  fastify.patch(
    get_route(route_schemas.reactivate_ungrouped_feature),
    opts,
    reactivate_ungrouped_feature_handler(fastify),
  );

  opts.schema = route_schemas.edit_ungrouped_feature;
  fastify.patch(
    get_route(route_schemas.edit_ungrouped_feature),
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
