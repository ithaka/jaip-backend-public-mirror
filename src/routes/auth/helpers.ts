import type { Session } from "../../types/sessions";
import type { Entity, User } from "../../types/entities";
import { DBEntity } from "../../types/database";
import {
  get_user_query,
  get_facility_query,
  map_entities,
  get_many_entities_select_clause,
} from "../queries/entities";
import axios from "axios";
import { session_query } from "../queries/session";
import {
  ensure_error,
  get_groups_with_any_features_enabled,
  ip_handler,
} from "../../utils";
import { FastifyInstance, FastifyRequest } from "fastify";
import { RESTRICTED_ITEMS_FEATURES, SUBDOMAINS } from "../../consts";
import { SESSION_MANAGER } from "../../consts";
import { JAIPDatabase } from "../../database";
import { user_roles } from "@prisma/client";

let counter: { [key: string]: number } = {};
export const manage_session = async (
  fastify: FastifyInstance,
  request: FastifyRequest,
  ignore_cookie: boolean = false,
): Promise<[Session, Error | null]> => {
  let session: Session = {} as Session;
  const is_admin_subdomain = SUBDOMAINS.admin.includes(request.subdomain);
  // We can't use the frontend UUID cookie on a student subdomain, because we
  // can't trust the cookie from the frontend alone. This means we will fall back to
  // creating a new session UUID based on the frontend request IP.
  const session_uuid =
    ignore_cookie || !is_admin_subdomain ? "" : request.cookies.uuid;
  try {
    fastify.log.info(`Attempting to manage session: ${session_uuid}`);
    const [host, error] = await fastify.discover(SESSION_MANAGER.name);
    if (error) throw error;
    const url = host + "v1/graphql";

    // These headers are spelled out specifically because some headers properties
    // will throw bad request errors from session service.
    const headers: {
      "fastly-client-ip": string | string[] | undefined;
      "x-jstor-requestid"?: string | string[] | undefined;
    } = {
      "fastly-client-ip":
        request.headers["fastly-client-ip"] || process.env.VPN_IP,
    };
    if (!ignore_cookie) {
      headers["x-jstor-requestid"] = request.headers["x-jstor-requestid"];
    } else {
      fastify.event_logger.pep_standard_log_start(
        "pep_auth_multiple_codes_retry",
        request,
        {
          log_made_by: "auth-api",
          event_description: "attempting auth while ignoring original cookie",
          sessionid: session_uuid,
          original_uuid: request.cookies.uuid,
        },
      );
    }

    const query = `mutation { sessionHttpHeaders(uuid: ${session_uuid ? `"${session_uuid}"` : null}) ${session_query}}`;

    if (ignore_cookie) {
      fastify.log.info(
        `Ignoring cookie, attempting to get session without UUID, IP: ${request.headers["fastly-client-ip"]}, Original UUID: ${request.cookies.uuid}, new UUID: ${session_uuid}`,
      );
      fastify.log.info(
        `Original UUID: ${request.cookies.uuid}, Query: ${query}`,
      );
      fastify.log.info(
        `Original UUID: ${request.cookies.uuid}, Headers: ${headers}`,
      );
    }
    const response = await axios.post(
      url,
      {
        query,
      },
      {
        headers: headers,
      },
    );

    if (response.status !== 200) {
      throw new Error("session management failed: Status code not 200");
    }
    if (!response.data?.data?.sessionHttpHeaders) {
      throw new Error("session management failed: No session returned");
    }
    fastify.log.info(
      `Session data retrieved: ${response.data?.data?.sessionHttpHeaders?.uuid}`,
    );
    session = response.data?.data?.sessionHttpHeaders;
    if (!session.uuid) {
      throw new Error("session management failed: session has no UUID");
    }

    const emails = get_email_from_session(session);
    fastify.log.info(
      `Emails found in session: ${emails}, IP: ${request.headers["fastly-client-ip"]}, uuid: ${request.cookies.uuid}`,
    );

    const codes = get_code_from_session(session);
    fastify.log.info(
      `Codes found in session: ${codes}, IP: ${request.headers["fastly-client-ip"]}, uuid: ${request.cookies.uuid}`,
    );

    if (codes.length > 1 && !emails.length) {
      fastify.event_logger.pep_standard_log_start(
        "pep_auth_multiple_codes",
        request,
        {
          log_made_by: "auth-api",
          event_description: "multiple codes found in session",
          sessionid: session.uuid,
          sitecodes: codes,
        },
      );
      if (ignore_cookie) {
        fastify.event_logger.pep_standard_log_start(
          "pep_auth_multiple_codes_retry_failed",
          request,
          {
            log_made_by: "auth-api",
            event_description:
              "multiple codes found in session, reattempt also returned multiple codes",
            sessionid: session.uuid,
            sitecodes: codes,
            original_uuid: request.cookies.uuid,
          },
        );
      }
      if (session_uuid) {
        fastify.log.info(`Counter: ${counter[session_uuid]}`);
      }

      if (
        session_uuid &&
        (!counter[session_uuid] || counter[session_uuid] < 5)
      ) {
        fastify.log.info(
          `Attempting to expire session with UUID, IP: ${request.headers["fastly-client-ip"]}, uuid: ${request.cookies.uuid}}`,
        );
        const query = `mutation { expireSession(uuid: "${session_uuid}") ${session_query}}`;
        await axios.post(
          url,
          {
            query,
          },
          {
            headers: headers,
          },
        );
        counter[session_uuid] = (counter[session_uuid] || 0) + 1;
        return await manage_session(fastify, request, true);
      } else if (session_uuid && counter[session_uuid] >= 5) {
        fastify.log.info(
          `Session with UUID ${session_uuid} has attempted ${counter[session_uuid]} times.`,
        );
      } else {
        fastify.log.info(
          `Multiple Codes found, but no session UUID, IP: ${request.headers["fastly-client-ip"]}, uuid: ${request.cookies.uuid}`,
        );
      }
    }
    if (codes.length === 1 && ignore_cookie) {
      fastify.event_logger.pep_standard_log_start(
        "pep_auth_multiple_codes_retry_succeeded",
        request,
        {
          log_made_by: "auth-api",
          event_description:
            "multiple codes found in session, reattempt returned single code",
          sessionid: session.uuid,
          sitecodes: codes,
          original_uuid: request.cookies.uuid,
        },
      );

      fastify.log.info(
        `Successfully got single code on retry, IP: ${request.headers["fastly-client-ip"]}, Original UUID: ${request.cookies.uuid}, new UUID: ${session.uuid}`,
      );
      counter = {};
      request.cookies.uuid = session.uuid;
    }
    return [session, null];
  } catch (err) {
    const error = ensure_error(err);
    return [{} as Session, error];
  }
};

export const get_code_from_session = (session: Session): string[] => {
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
export const get_email_from_session = (session: Session): string[] => {
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

const get_user = async (
  db: JAIPDatabase,
  arr: string[],
): Promise<[User | null, Error | null]> => {
  try {
    // @ts-expect-error Prisma isn't able to parse the query correctly in assigning a type to the result.
    const result: DBEntity = await db.get_first_user(get_user_query(arr));
    if (!result) {
      throw new Error("No user found with the provided emails");
    }
    return [map_entities(result), null];
  } catch (err) {
    const error = ensure_error(err);

    return [null, error];
  }
};

const get_facility = async (
  db: JAIPDatabase,
  arr: string[],
): Promise<[User | null, Error | null]> => {
  try {
    // @ts-expect-error Prisma isn't able to parse the query correctly in assigning a type to the result.
    const result: DBEntity = await db.get_first_facility(
      get_facility_query(arr),
    );
    if (!result) {
      return [null, null];
    }
    return [map_entities(result), null];
  } catch (err) {
    const error = ensure_error(err);
    return [null, error];
  }
};

const get_ip_bypass = async (
  db: JAIPDatabase,
  ip: string,
): Promise<[User | null, Error | null]> => {
  try {
    const result = await db.get_ip_bypass({
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
  db: JAIPDatabase,
  subdomain: string,
  codes: string[],
): Promise<[string | null, Error | null]> => {
  try {
    const result = await db.get_sitecode_by_subdomain({
      where: {
        subdomain,
        sitecode: {
          in: codes,
        },
      },
      select: {
        sitecode: true,
        facility_id: true,
        facilities: {
          select: {
            jstor_id: true,
          },
        },
      },
      orderBy: {
        facility_id: "desc",
      },
    });
    if (!result || !result.facilities?.jstor_id) {
      return [null, null];
    }
    return [result.facilities?.jstor_id, null];
  } catch (err) {
    const error = ensure_error(err);
    return [null, error];
  }
};

// Accepts a request and a fastify instance and returns the current user, after retrieving session data
export const get_current_user = async (
  fastify: FastifyInstance,
  request: FastifyRequest,
  emails: string[],
  codes: string[],
  include_facilities: boolean,
): Promise<[User | null, Error | null]> => {
  let current_user: User | null = null;
  try {
    // If there are emails, try to find a user with one of them
    if (emails.length) {
      const [result, error] = await get_user(fastify.db, emails);
      current_user = result;
      if (error) {
        throw error;
        // If a user is found, we don't need to check codes or IPS
      } else if (current_user) {
        // If the user can access restricted items in any of their groups, we
        // want to get the facilities associated with those groups and add them
        // to the user object. This makes it easier to access that information on
        // the frontend without separate API calls.
        const groups_with_restricted_items_access =
          get_groups_with_any_features_enabled(
            current_user,
            RESTRICTED_ITEMS_FEATURES,
          );
        if (groups_with_restricted_items_access.length && include_facilities) {
          const [facilities, facilities_error] =
            await fastify.db.get_facilities({
              where: {
                entities: {
                  groups_entities: {
                    some: {
                      group_id: {
                        in: groups_with_restricted_items_access,
                      },
                    },
                  },
                },
              },
              select: {
                ...get_many_entities_select_clause(
                  user_roles.user,
                  groups_with_restricted_items_access,
                ),
              },
            });
          if (facilities_error) {
            throw error;
          } else if (facilities.length) {
            current_user.facilities = facilities.map((facility) => {
              return map_entities(facility) as Entity;
            });
          }
        }
        return [current_user, null];
      }
    }

    if (codes.length) {
      const subdomain = request.subdomain;
      fastify.log.info(`Subdomain found in request: ${subdomain}`);
      if (
        !SUBDOMAINS.student.includes(subdomain) &&
        !SUBDOMAINS.admin.includes(subdomain)
      ) {
        const [sitecode, error] = await get_sitecode_by_subdomain(
          fastify.db,
          subdomain,
          codes,
        );
        if (error) {
          throw error;
        } else if (sitecode) {
          fastify.log.info(
            `Sitecode found for subdomain ${subdomain}: ${sitecode}`,
          );
          codes.push(sitecode);
        } else {
          throw new Error(
            `No sitecode found for nonstandard subdomain ${subdomain}`,
          );
        }
      }

      fastify.log.info(`Getting facility by code: ${codes}`);
      // If there are codes, try to find a facility with one of them
      const [result, error] = await get_facility(fastify.db, codes);
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
      fastify.log.info(`Attempting IP bypass: ${ip}`);
      const [result, error] = await get_ip_bypass(fastify.db, ip);
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
