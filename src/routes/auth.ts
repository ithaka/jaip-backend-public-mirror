import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteShorthandOptions,
} from "fastify";
import axios, { AxiosResponse } from "axios";

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

const session_manager = "session-service";

const getSessionManagement = async (
  fastify: FastifyInstance,
): Promise<string> => {
  try {
    const { route, error } = await fastify.discover(session_manager);
    if (error) throw error;
    if (route === "") {
      throw new Error(
        `Service discovery failed: No route found for ${session_manager}`,
      );
    }
    return route;
  } catch (err) {
    console.log(err);
    return "";
  }
};

const manageSession = async (
  fastify: FastifyInstance,
  request: FastifyRequest,
): Promise<AxiosResponse<any, any>> => {
  const sg = await getSessionManagement(fastify);
  const uuid = request.cookies.uuid || "";
  console.log("UUID: ", uuid);

  const query = uuid
    ? `mutation { session(uuid: "${uuid}") { uuid }}`
    : `mutation { session { uuid }}`;
  const response = await axios.post(sg + "v1/graphql", {
    query,
  });
  return response;
};

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  fastify.get(
    "/auth/session",
    opts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      opts.schema = schema;
      let uuid = "";
      try {
        const session = await manageSession(fastify, request);
        uuid = session.data;
      } catch (err) {
        console.log(err);
      }

      return {
        hello: "world",
        uuid: uuid,
      };
    },
  );
}

export default routes;
