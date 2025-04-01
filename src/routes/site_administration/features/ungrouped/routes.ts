import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import {
  add_ungrouped_feature_handler,
  delete_ungrouped_feature_handler,
  edit_ungrouped_feature_handler,
  get_ungrouped_features_handler,
  reactivate_ungrouped_feature_handler,
} from "./handlers";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.get_ungrouped_features;
  fastify.post("/ungrouped/get", opts, get_ungrouped_features_handler(fastify));

  opts.schema = route_schemas.add_ungrouped_feature;
  fastify.post("/ungrouped", opts, add_ungrouped_feature_handler(fastify));

  opts.schema = route_schemas.delete_ungrouped_feature;
  fastify.delete("/ungrouped", opts, delete_ungrouped_feature_handler(fastify));

  opts.schema = route_schemas.reactivate_ungrouped_feature;
  fastify.patch(
    "/ungrouped/reactivate",
    opts,
    reactivate_ungrouped_feature_handler(fastify),
  );

  opts.schema = route_schemas.edit_ungrouped_feature;
  fastify.patch("/ungrouped", opts, edit_ungrouped_feature_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: "/site_administration/features",
  },
};
