import {
  FastifyInstance,
  FastifyRequest,
  RouteShorthandOptions,
} from "fastify";
import axios from "axios";

import { sessionQuery } from "../queries/session";
import { SWAGGER_TAGS } from "../../utils/swagger_tags";
import { public_endpoint_disclaimer } from "../../utils/messages";
import { ensure_error, ip_handler, get_subdomain } from "../../utils";

import type { Session } from "../../types/sessions";
import { PrismaClient } from "@prisma/client";
import type { User } from "../../types/entities";
import { DBEntity } from "../../types/database";
import {
  get_user_query,
  get_facility_query,
  map_entities,
} from "../queries/entities";
import { ADMIN_SUBDOMAINS, ENTITY_TYPES } from "../../consts";
import { LogPayload } from "../../event_handler";

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
  const uuid = request.cookies.uuid || "";
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
  const codes = [];
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

const getUser = async (
  db: PrismaClient,
  arr: string[],
): Promise<[User | null, Error | null]> => {
  try {
    // @ts-expect-error Prisma isn't able to parse the query correctly in assigning a type to the result.
    const result: DBEntity = await db.users.findFirst(get_user_query(arr));
    if (result === null) {
      throw new Error("No user found with the provided emails");
    }
    return [map_entities(result), null];
  } catch (err) {
    const error = ensure_error(err);
    return [null, error];
  }
};

const getFacility = async (
  db: PrismaClient,
  arr: string[],
): Promise<[User | null, Error | null]> => {
  try {
    // @ts-expect-error Prisma isn't able to parse the query correctly in assigning a type to the result.
    const result: DBEntity = await db.facilities.findFirst(
      get_facility_query(arr),
    );
    if (result === null) {
      throw new Error("No user found with the provided emails");
    }
    return [map_entities(result), null];
  } catch (err) {
    const error = ensure_error(err);
    return [null, error];
  }
};

const getIPBypass = async (
  db: PrismaClient,
  ip: string,
): Promise<[User | null, Error | null]> => {
  try {
    const result = await db.ip_bypass.findFirst({
      where: {
        ip,
      },
      select: {
        facilities: {
          select: {
            jstor_id: true,
          },
        },
      },
    });

    // Because this function is called in a loop, not finding a bypass isn't really
    // a reason to throw an error, it's just a reason to try again.
    if (!result || !result?.facilities?.jstor_id) {
      return [null, null];
    }

    const [facility, error] = await getFacility(db, [
      result.facilities.jstor_id,
    ]);
    if (error) {
      throw error;
    }
    return [facility, null];
  } catch (err) {
    const error = ensure_error(err);
    return [null, error];
  }
};

// Accepts a request and a fastify instance and returns the current user, after retrieving session data
const getCurrentUser = async (
  fastify: FastifyInstance,
  request: FastifyRequest,
  session: Session,
): Promise<[User | null, Error | null]> => {
  let currentUser: User | null = null;
  try {
    // Extract the email from the session
    const emails = getEmailFromSession(session);
    // If there are emails, try to find a user with one of them
    if (emails.length) {
      const [result, error] = await getUser(fastify.prisma, emails);
      currentUser = result;
      if (error) {
        throw error;
        // If a user is found, we don't need to look for anything else
      } else if (currentUser) {
        return [currentUser, null];
      }
    }

    // Extract the codes from the session
    const codes = getCodeFromSession(session);
    if (codes.length) {
      // If there are codes, try to find a facility with one of them
      const [result, error] = await getFacility(fastify.prisma, codes);
      currentUser = result;
      if (error) {
        throw error;
        // If a facility is found, we don't need to look for anything else
      } else if (currentUser) {
        return [currentUser, null];
      }
    }

    // If we haven't yet found a user or facility, try to find an IP bypass
    // Extract an array of possible IPs from the request
    const ips = ip_handler(request);
    for (const ip of ips) {
      const [result, error] = await getIPBypass(fastify.prisma, ip);
      if (error) {
        throw error;
      }
      // If we find a facility, we don't need to look for anything else
      if (result) {
        currentUser = result;
        return [currentUser, null];
      }
    }
    return [null, null];
  } catch (err) {
    const error = ensure_error(err);
    return [null, error];
  }
};

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  // ************************************************************************************************
  // AUTH SESSION
  // ************************************************************************************************
  // Auth Session Schema
  opts.schema = {
    description: `Returns auth information based on ip address or email associated with UUID cookie. ${public_endpoint_disclaimer}`,
    tags: [SWAGGER_TAGS.public],
    response: {
      200: {
        type: "object",
        properties: {
          currentUser: {} as User,
        },
      },
    },
  };

  // Auth Session Route
  fastify.get("/auth/session", opts, async (request, reply) => {
    fastify.eventLogger.pep_auth_start(request);
    const log_payload: LogPayload = {};
    const [session, err] = await manageSession(fastify, request);
    if (err) {
      throw err;
    }
    log_payload.sessionid = session.uuid;
    const [currentUser, error] = await getCurrentUser(
      fastify,
      request,
      session,
    );
    if (currentUser) {
      log_payload.user = currentUser;
    }
    if (error) {
      reply.code(500).send();
      fastify.eventLogger.pep_error(request, reply, log_payload, "auth", error);
      return;
    } else if (!currentUser) {
      reply.code(401).send();
      fastify.eventLogger.pep_unauthorized_error(request, reply, log_payload);
      return;
    } else {
      const subdomain = get_subdomain(request.headers.host || "");
      const is_admin_subdomain = ADMIN_SUBDOMAINS.includes(subdomain);
      if (is_admin_subdomain && currentUser.type !== ENTITY_TYPES.users) {
        reply.code(403).send();
        fastify.eventLogger.pep_forbidden_error(request, reply, log_payload);
        return;
      }
    }
    fastify.eventLogger.pep_auth_complete(request, reply, log_payload);
    reply.code(200).send({ currentUser });
  });

  // ************************************************************************************************
  // SUBDOMAINS
  // ************************************************************************************************
  // Subdomains Schema
  opts.schema = {
    description: `Returns subdomain validation. ${public_endpoint_disclaimer}`,
    tags: [SWAGGER_TAGS.public],
    response: {
      200: {
        type: "object",
        properties: {
          subdomain: { type: "string" },
        },
      },
    },
  };

  // Subdomains Route
  fastify.get("/subdomains", async (request, reply) => {
    const host = request.headers.host || "";
    const subdomain = get_subdomain(host);
    try {
      const result = await fastify.prisma.subdomains.findFirst({
        where: {
          subdomain,
          is_active: true,
        },
        select: {
          subdomain: true,
        },
      });
      reply.code(200).send(result);
    } catch (err) {
      const error = ensure_error(err);
      fastify.eventLogger.pep_error(request, reply, {}, "subdomains", error);
      reply.code(500).send();
    }
  });
}

export default routes;
