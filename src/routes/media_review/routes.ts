import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { status_options } from "@prisma/client";
import {
  approval_handler,
  bulk_approval_handler,
  bulk_undo_handler,
  denial_and_incomplete_handler,
  request_handler,
} from "./handlers";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.request;

  fastify.post("/request", opts, request_handler(fastify));

  opts.schema = route_schemas.approve;
  fastify.post("/approve", opts, approval_handler(fastify));

  opts.schema = route_schemas.deny;
  fastify.post(
    "/deny",
    opts,
    denial_and_incomplete_handler(fastify, status_options.Denied),
  );

  opts.schema = route_schemas.incomplete;
  fastify.post(
    "/incomplete",
    opts,
    denial_and_incomplete_handler(fastify, status_options.Incomplete),
  );

  opts.schema = route_schemas.bulk;
  fastify.post("/bulk", opts, bulk_approval_handler(fastify));

  opts.schema = route_schemas.bulk_undo;
  fastify.post("/bulk-undo", opts, bulk_undo_handler(fastify));
}

export default routes;
