import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas.js";
import { status_options } from "@prisma/client";
import {
  approval_handler,
  bulk_approval_handler,
  bulk_undo_handler,
  denial_and_incomplete_handler,
  request_handler,
} from "./handlers.js";
import { media_review_prefix } from "./options.js";
import { get_route } from "../../utils/index.js";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.request;
  fastify.post(get_route(opts.schema), opts, request_handler(fastify));

  opts.schema = route_schemas.approve;
  fastify.post(get_route(opts.schema), opts, approval_handler(fastify));

  opts.schema = route_schemas.deny;
  fastify.post(
    get_route(opts.schema),
    opts,
    denial_and_incomplete_handler(fastify, status_options.Denied),
  );

  opts.schema = route_schemas.incomplete;
  fastify.post(
    get_route(opts.schema),
    opts,
    denial_and_incomplete_handler(fastify, status_options.Incomplete),
  );

  opts.schema = route_schemas.bulk;
  fastify.post(get_route(opts.schema), opts, bulk_approval_handler(fastify));

  opts.schema = route_schemas.bulk_undo;
  fastify.post(get_route(opts.schema), opts, bulk_undo_handler(fastify));
}

export default {
  routes,
  options: {
    prefix: media_review_prefix,
  },
};
