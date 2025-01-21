import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteShorthandOptions,
} from "fastify";

const schema = {
  response: {
    200: {
      type: "object",
      properties: {
        hello: { type: "string" },
        route: { type: "string" },
      },
    },
  },
};
async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  fastify.get(
    "/",
    opts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      opts.schema = schema;

      const route = await fastify.discover("pdf-delivery-service");
      return { hello: "world", route: route };
    },
  );
}

export default routes;
