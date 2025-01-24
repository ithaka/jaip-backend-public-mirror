import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteShorthandOptions,
} from "fastify";
import axios from "axios";
import type { Session } from "../types/sessions";
import { sessionQuery } from "./queries/session";
import { SWAGGER_TAGS } from "../utils/swagger_tags";
import { publicEndpointDisclaimer } from "../utils/messages";
const schema = {
  description: `Returns auth information based on ip address or email associated with UUID cookie. ${publicEndpointDisclaimer}`,
  tags: [SWAGGER_TAGS.public],
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
    const sessionService = await getSessionManagement(fastify);
    if (!sessionService)
      throw new Error(
        `Service discovery failed: No route found for ${session_manager}`,
      );

    const query = uuid
      ? `mutation { session(uuid: "${uuid}") ${sessionQuery}}`
      : `mutation { session ${sessionQuery}}`;
    const response = await axios.post(sessionService + "v1/graphql", {
      query,
    });
    if (response.status !== 200) {
      throw new Error("Session management failed: Status code not 200");
    }
    if (!response.data?.data?.session) {
      throw new Error("Session management failed: No session returned");
    }
    session = response.data?.data?.session;
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
        session = await manageSession(fastify, request);
        uuid = session.uuid;
      } catch (err) {
        console.log(err);
        return err;
      }

      return {
        uuid,
        session: session,
      };
    },
  );

  fastify.get("/names", async (req, reply) => {
    const client = await fastify.pg.jaip_db.connect();
    try {
      const { rows } = await client.query("SELECT id, name FROM entities");
      return rows;
    } catch (err) {
      console.log(err);
      return err;
    } finally {
      // Release the client immediately after query resolves, or upon error
      client.release();
    }
  });
}

export default routes;
