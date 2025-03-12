import type { Session } from "../../types/sessions";
import { PrismaClient } from "@prisma/client";
import type { User } from "../../types/entities";
import { DBEntity } from "../../types/database";
import {
  get_user_query,
  get_facility_query,
  map_entities,
} from "../queries/entities";
import axios from "axios";
import { session_query } from "../queries/session";
import { ensure_error, ip_handler } from "../../utils";
import { FastifyInstance, FastifyRequest } from "fastify";
import { SUBDOMAINS } from "../../consts";
import { SESSION_MANAGER } from "../../consts";

export const manage_session = async (
  fastify: FastifyInstance,
  request: FastifyRequest,
): Promise<[Session, Error | null]> => {
  const uuid = request.cookies.uuid || "";
  let session: Session = {} as Session;
  try {
    const [host, error] = await fastify.discover(SESSION_MANAGER.name);
    if (error) throw error;
    const query = uuid
      ? `mutation { session(uuid: "${uuid}") ${session_query}}`
      : `mutation { session ${session_query}}`;

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

const get_code_from_session = (session: Session): string[] => {
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
const get_email_from_session = (session: Session): string[] => {
  const emails = ["ryan.mccarthy+1@ithaka.org"];
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

const get_user = async (
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

const get_facility = async (
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

const get_ip_bypass = async (
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

    const [facility, error] = await get_facility(db, [
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

const get_sitecode_by_subdomain = async (
  db: PrismaClient,
  subdomain: string,
): Promise<[string | null, Error | null]> => {
  try {
    const result = await db.subdomains_facilities.findFirst({
      where: {
        subdomain,
      },
      select: {
        sitecode: true,
        facility_id: true,
      },
    });
    if (!result || !result.sitecode) {
      return [null, null];
    }
    return [result.sitecode, null];
  } catch (err) {
    const error = ensure_error(err);
    return [null, error];
  }
};

// Accepts a request and a fastify instance and returns the current user, after retrieving session data
export const get_current_user = async (
  fastify: FastifyInstance,
  request: FastifyRequest,
  session: Session,
): Promise<[User | null, Error | null]> => {
  let current_user: User | null = null;
  try {
    // Extract the email from the session
    const emails = get_email_from_session(session);
    // If there are emails, try to find a user with one of them
    if (emails.length) {
      const [result, error] = await get_user(fastify.prisma, emails);
      current_user = result;
      if (error) {
        throw error;
        // If a user is found, we don't need to look for anything else
      } else if (current_user) {
        return [current_user, null];
      }
    }

    // Extract the codes from the session
    const codes = get_code_from_session(session);
    if (codes.length) {
      const subdomain = request.subdomain;
      if (!SUBDOMAINS.student.includes(subdomain)) {
        const [sitecode, error] = await get_sitecode_by_subdomain(
          fastify.prisma,
          subdomain,
        );
        if (error) {
          throw error;
        } else if (sitecode) {
          codes.push(sitecode);
        } else {
          throw new Error(
            "No sitecode found for nonstandard subdomain subdomain",
          );
        }
      }

      // If there are codes, try to find a facility with one of them
      const [result, error] = await get_facility(fastify.prisma, codes);
      current_user = result;
      if (error) {
        throw error;
        // If a facility is found, we don't need to look for anything else
      } else if (current_user) {
        return [current_user, null];
      }
    }

    // If we haven't yet found a user or facility, try to find an IP bypass
    // Extract an array of possible IPs from the request
    const ips = ip_handler(request);
    for (const ip of ips) {
      const [result, error] = await get_ip_bypass(fastify.prisma, ip);
      if (error) {
        throw error;
      }
      // If we find a facility, we don't need to look for anything else
      if (result) {
        current_user = result;
        return [current_user, null];
      }
    }
    return [null, null];
  } catch (err) {
    const error = ensure_error(err);
    return [null, error];
  }
};
