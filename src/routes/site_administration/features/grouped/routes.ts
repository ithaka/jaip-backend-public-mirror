import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import {
  add_group_feature_handler,
  delete_group_feature_handler,
  edit_group_feature_handler,
  get_group_features_handler,
  reactivate_group_feature_handler,
} from "./handlers";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.get_group_features;
  fastify.post("/grouped/get", opts, get_group_features_handler(fastify));

  opts.schema = route_schemas.add_group_feature;
  fastify.post("/grouped", opts, add_group_feature_handler(fastify));

  opts.schema = route_schemas.delete_group_feature;
  fastify.delete("/grouped", opts, delete_group_feature_handler(fastify));

  opts.schema = route_schemas.reactivate_group_feature;
  fastify.patch(
    "/grouped/reactivate",
    opts,
    reactivate_group_feature_handler(fastify),
  );

  opts.schema = route_schemas.edit_group_feature;
  fastify.patch("/grouped", opts, edit_group_feature_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: "/site_administration/features",
  },
};
