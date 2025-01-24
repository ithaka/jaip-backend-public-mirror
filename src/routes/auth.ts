import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteShorthandOptions,
} from "fastify";
import axios from "axios";

import { sessionQuery } from "./queries/session";
import { SWAGGER_TAGS } from "../utils/swagger_tags";
import { publicEndpointDisclaimer } from "../utils/messages";

import type { Session } from "../types/sessions";
import type { User } from "../types/users";
import type { PostgresDb } from "@fastify/postgres";
import type { Query, QueryResult } from "pg";

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

const getCodeFromSession = (session: Session): string[] => {
  let codes = [];
  if (session.userAccount?.code) {
    codes.push(session.userAccount.code);
  }
  session.authenticatedAccounts?.forEach((account) => {
    if (account.code) {
      codes.push(account.code);
    }
  });

  return codes;
};
const getEmailFromSession = (session: Session): string[] => {
  const emails = [];
  if (session.userAccount?.contact?.email) {
    emails.push(session.userAccount.contact.email);
  }

  session.authenticatedAccounts?.forEach((account) => {
    if (account.contact.email) {
      emails.push(account.contact.email);
    }
  });

  return emails;
};

const getEntity = (db: PostgresDb, arr: string[]): [QueryResult<any>, any] => {
  const jstor_id_query =
    "SELECT * FROM whole_entities WHERE jstor_id = ANY($1) ORDER BY id DESC LIMIT 1";
  let result = {} as QueryResult<any>;
  let error: any;
  db.query(jstor_id_query, [arr], (err, res) => {
    console.log(res);
    result = res;
    error = err;
  });
  console.log(result, error);
  return [result, error];
};

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = {
    description: `Returns auth information based on ip address or email associated with UUID cookie. ${publicEndpointDisclaimer}`,
    tags: [SWAGGER_TAGS.public],
    response: {
      200: {
        type: "object",
        properties: {
          uuid: { type: "string" },
          session: { type: "string" },
          user1: { type: "string" },
          user2: { type: "string" },
        },
      },
    },
  };

  fastify.get(
    "/auth/session",
    opts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      let uuid = "";
      let session = {} as Session;
      let user1 = {} as QueryResult<any>;
      let user2 = {} as QueryResult<any>;

      try {
        session = await manageSession(fastify, request);
        const emails = getEmailFromSession(session);
        const codes = getCodeFromSession(session);
        emails.push("ryan.mccarthy@ithaka.org");
        codes.push("jstor.org");
        if (emails.length) {
          const [result, error] = getEntity(fastify.pg.jaip_db, emails);
          console.log(error);
          console.log(result);
          user1 = result;
        }
        if (codes.length) {
          const [result, error] = getEntity(fastify.pg.jaip_db, codes);
          console.log(error);
          console.log(result);

          user2 = result;
        }

        uuid = session.uuid;
      } catch (err) {
        console.log(err);
        return err;
      }

      return {
        uuid,
        session: session,
        user1: JSON.stringify(user1),
        user2: JSON.stringify(user2),
      };
    },
  );

  opts.schema = {
    description: `Returns subdomain validation. ${publicEndpointDisclaimer}`,
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

  fastify.get("/subdomains", async (req, reply) => {
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
