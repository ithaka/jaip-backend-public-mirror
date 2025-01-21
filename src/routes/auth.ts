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
): Promise<string> => {
  let uuid = request.cookies.uuid || "";
  try {
    const sg = await getSessionManagement(fastify);
    if (!sg) throw new Error("Service discovery failed: No route found");
    const query = uuid
      ? `mutation { session(uuid: "${uuid}") { uuid }}`
      : `mutation { session { uuid }}`;
    const response = await axios.post(sg + "v1/graphql", {
      query,
    });
    if (response.status !== 200) {
      throw new Error("Session management failed: Status code not 200");
    }
    if (!response.data) {
      throw new Error("Session management failed: No uuid returned");
    }
    uuid = response.data;
  } catch (err) {
    console.log(err);
  }

  return uuid;
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
        uuid = session;
      } catch (err) {
        console.log(err);
      }

      return {
        uuid: uuid,
      };
    },
  );
}

export default routes;
