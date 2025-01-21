import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteShorthandOptions,
} from "fastify";
import axios from "axios";

const schema = {
  response: {
    200: {
      type: "object",
      properties: {
        hello: { type: "string" },
        route: { type: "string" },
        ip_data: {
          type: "object",
          properties: {
            ip: { type: "string" },
            ips: { type: "array" },
            headers: { type: "object" },
          },
        },
      },
    },
  },
};
const getSessionGateway = async (fastify: FastifyInstance): Promise<string> => {
  try {
    const { route, error } = await fastify.discover("session-gateway");
    if (error) throw error;
    if (route === "") {
      throw new Error(
        "Service discovery failed: No route found for session-gateway",
      );
    }
    return route;
  } catch (err) {
    console.log(err);
    return "";
  }
};
const newSession = async (url: string, ip: string): Promise<boolean> => {
  const response = await axios.post(url + "/v1/graphql", {});
  return true;
};

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  fastify.get(
    "/",
    opts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      opts.schema = schema;
      try {
        const sg = await getSessionGateway(fastify);
        console.log(sg);
        console.log(request.raw);
      } catch (err) {
        console.log(err);
      }

      return {
        hello: "world",
        ip_data: {
          ip: request.ip,
          ips: request.ips,
        },
      };
    },
  );
}

export default routes;
