import {
  FastifyInstance,
  RouteShorthandOptions,
  DoneFuncWithErrOrRes,
} from "fastify";

export default function (
  fastify: FastifyInstance,
  opts: RouteShorthandOptions,
  done: DoneFuncWithErrOrRes,
) {
  fastify.decorate("utility", function () {});

  fastify.register(require("./other-plugin"));

  done();
}
