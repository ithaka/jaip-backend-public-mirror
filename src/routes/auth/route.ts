import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteShorthandOptions,
} from "fastify";
import axios from "axios";

import { sessionQuery } from "../queries/session";
import { SWAGGER_TAGS } from "../../utils/swagger_tags";
import { publicEndpointDisclaimer } from "../../utils/messages";
import { ensure_error } from "../../utils/error_verification";

import type { Session } from "../../types/sessions";
import type { PostgresDb } from "@fastify/postgres";
import type { QueryResult } from "pg";

const session_manager = "session-service";

const getSessionManagement = async (
  fastify: FastifyInstance,
): Promise<[string, Error | null]> => {
  try {
    const { route, error } = await fastify.discover(session_manager);
    if (error) throw error;
    if (!route) {
      throw new Error(
        `service discovery failed: No route found for ${session_manager}`,
      );
    }
    return [route, null];
  } catch (err) {
    const error = ensure_error(err);
    return ["", error];
  }
};

const manageSession = async (
  fastify: FastifyInstance,
  request: FastifyRequest,
): Promise<[Session, Error | null]> => {
  let uuid = request.cookies.uuid || "";
  let session: Session = {} as Session;
  try {
    const [host, error] = await getSessionManagement(fastify);
    if (error) throw error;
    if (!host)
      throw new Error(
        `service discovery failed: No route found for ${session_manager}`,
      );

    const query = uuid
      ? `mutation { session(uuid: "${uuid}") ${sessionQuery}}`
      : `mutation { session ${sessionQuery}}`;
    const url = host + "v1/graphql";
    const response = await axios.post(url, {
      query,
    });
    if (response.status !== 200) {
      throw new Error("session management failed: Status code not 200");
    }
    if (!response.data?.data?.session) {
      throw new Error("session management failed: No session returned");
    }
    session = response.data?.data?.session;
    if (!session.uuid) {
      throw new Error("session management failed: session has no UUID");
    }
    return [session, null];
  } catch (err) {
    const error = ensure_error(err);
    return [{} as Session, error];
  }
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
    if (account?.contact?.email) {
      emails.push(account?.contact?.email);
    }
  });

  return emails;
};

const getEntity = async (
  db: PostgresDb,
  arr: string[],
): Promise<[QueryResult<any>, Error | null]> => {
  const jstor_id_query =
    "SELECT * FROM whole_entities WHERE jstor_id = ANY($1) ORDER BY id DESC LIMIT 1";
  try {
    const result = await db.query(jstor_id_query, [arr]);
    return [result, null];
  } catch (err) {
    const error = ensure_error(err);
    return [{} as QueryResult, error];
  }
};

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = {
    description: `Returns auth information based on ip address or email associated with UUID cookie. ${publicEndpointDisclaimer}`,
    tags: [SWAGGER_TAGS.public],
    response: {
      200: {
        type: "object",
        properties: {
          session: { type: "string" },
        },
      },
    },
  };

  fastify.get(
    "/auth/session",
    opts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      fastify.eventLogger.pep_auth_start(request);
      let session = {} as Session;

      try {
        const [returned_session, err] = await manageSession(fastify, request);
        if (err) {
          throw err;
        }
        session = returned_session;

        const emails = getEmailFromSession(session);
        if (emails.length) {
          const [result, error] = await getEntity(fastify.pg.jaip_db, emails);
          if (error) {
            throw error;
          }
          console.log(result.rows);
        }

        const codes = getCodeFromSession(session);
        if (codes.length) {
          const [result, error] = await getEntity(fastify.pg.jaip_db, codes);
          console.log(result.rows);
          if (error) {
            throw error;
          }
        }
      } catch (err) {
        const error = ensure_error(err);
        fastify.eventLogger.pep_error("auth_session", error);
        return err;
      }

      return {
        session,
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
    const host = req.headers.host || "";
    const subdomain = host.split(".").slice(0, -2).join(".");

    try {
      const result = await fastify.pg.jaip_db.query(
        "SELECT subdomain FROM subdomains WHERE is_active = true AND subdomain = $1",
        [subdomain],
      );
      console.log(result.rows);
      return result.rows;
    } catch (err) {
      console.log(err);
      return err;
    }
  });
}

export default routes;
