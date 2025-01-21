import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteShorthandOptions,
} from "fastify";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  fastify.get(
    "/",
    opts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      opts.schema = {
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

      const route = await fastify.discover("pdf-delivery-service");
      return { hello: "world", route: route };
    },
  );
}

export default routes;
