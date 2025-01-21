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
      console.log("SERVICE ROUTE:");
      console.log(route);
      return { hello: "world", route: JSON.stringify(route.data) };
    },
  );
}

export default routes;
