import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteShorthandOptions,
} from "fastify";
import axios from "axios";
import type { Session } from "../types/sessions";
import { sessionQuery } from "./queries/session";

const schema = {
  response: {
    200: {
      type: "object",
      properties: {
        uuid: { type: "string" },
        session: { type: "string" },
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
): Promise<Session> => {
  let uuid = request.cookies.uuid || "";
  let session: Session = {} as Session;
  try {
    const sg = await getSessionManagement(fastify);
    if (!sg) throw new Error("Service discovery failed: No route found");

    const query = uuid
      ? `mutation { session(uuid: "${uuid}") ${sessionQuery}}`
      : `mutation { session ${sessionQuery}}`;
    const response = await axios.post(sg + "v1/graphql", {
      query,
    });
    if (response.status !== 200) {
      throw new Error("Session management failed: Status code not 200");
    }
    if (!response.data) {
      throw new Error("Session management failed: No uuid returned");
    }
    console.log("Session Management Response");
    console.log(response.data);
    console.log(response.status);
    session = response.data;
  } catch (err) {
    console.log(err);
  }

  return session;
};

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  fastify.get(
    "/auth/session",
    opts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      opts.schema = schema;
      let uuid = "";
      let session: Session = {} as Session;
      try {
        const session = await manageSession(fastify, request);
        uuid = session.uuid;
        console.log("Returned Session Value");
        console.log(session);
      } catch (err) {
        console.log(err);
      }

      return {
        uuid: uuid,
        session: JSON.stringify(session),
      };
    },
  );
}

export default routes;
