import type { Session } from "../../types/sessions";
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
import { JAIPDatabase } from "../../database";
import { v4 } from "uuid";

export const manage_session = async (
  fastify: FastifyInstance,
  request: FastifyRequest,
): Promise<[Session, Error | null]> => {
  const uuid = request.cookies.uuid || "";
  let session: Session = {} as Session;
  const session_uuid = uuid;
  if (!session_uuid) {
    // This is to check whether the uuid generation is properly random. It seems 
    // we may have had some duplicate UUIDs.
    fastify.log.info(`No UUID found in request: ${v4()}`);
  }
  try {
    fastify.log.info(`Attempting to manage session: ${session_uuid}`);
    const [host, error] = await fastify.discover(SESSION_MANAGER.name);
    if (error) throw error;
    const url = host + "v1/graphql";
    
    // These headers are spelled out specifically because some headers properties
    // will throw bad request errors from session service. 
    const headers = {
      cookie: request.headers.cookie,
      host: request.headers.host,
      "user-agent": request.headers["user-agent"],
      "x-forwarded-for": request.headers["x-forwarded-for"],
      referer: request.headers.referer,
      "x-request-id": request.headers["x-request-id"],
      "fastly-dc": request.headers["fastly-dc"],
      "fastly-ff": request.headers["fastly-ff"],
      "fastly-ssl": request.headers["fastly-ssl"],
      "fastly-client-ip": request.headers["fastly-client-ip"] || process.env.VPN_IP,
      "fastly-orig-accept-encoding": request.headers["fastly-orig-accept-encoding"],
      region: request.headers.region,
      city: request.headers.city,
      "x-envoy-external-address": request.headers["x-envoy-external-address"],
      "x-envoy-expected-rq-timeout-ms": request.headers["x-envoy-expected-rq-timeout-ms"],
      "x-sigsci-edgemodule": request.headers["x-sigsci-edgemodule"],
      "x-sigsci-requestid": request.headers["x-sigsci-requestid"],
      "x-jstor-requestid": request.headers["x-jstor-requestid"],
      "x-forwarded-host": request.headers["x-forwarded-host"],
      "x-forwarded-proto": request.headers["x-forwarded-proto"],
      "x-forwarded-port": request.headers["x-forwarded-port"],
      "x-forwarded-server": request.headers["x-forwarded-server"],
      "x-timer": request.headers["x-timer"],
      "x-amzn-trace-id": request.headers["x-amzn-trace-id"],
      "x-requested-host": request.headers["x-requested-host"],
      "gmt-offset": request.headers["gmt-offset"],
      "accept-language": request.headers["accept-language"],
      "accept-encoding": request.headers["accept-encoding"],
      "accept": request.headers["accept"],
      "sec-fetch-site": request.headers["sec-fetch-site"],
      "sec-fetch-mode": request.headers["sec-fetch-mode"],
      "sec-fetch-dest": request.headers["sec-fetch-dest"],
      "sec-ch-ua": request.headers["sec-ch-ua"],
      "sec-ch-ua-mobile": request.headers["sec-ch-ua-mobile"],
      "sec-ch-ua-platform": request.headers["sec-ch-ua-platform"],
      "cdn-loop": request.headers["cdn-loop"],
      "priority": request.headers["priority"],
      "continent-code": request.headers["continent-code"],
      "country-code": request.headers["country-code"],
    }

    const query = `mutation { sessionHttpHeaders(uuid: ${ session_uuid ? `"${session_uuid}"` : null }) ${session_query}}`;

    const response = await axios.post(url, {
      query,
    }, {
      headers: headers
    });

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
      throw new Error("No facility found with the provided emails");
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
  session: Session,
): Promise<[User | null, Error | null]> => {
  let current_user: User | null = null;
  try {
    // Extract the email from the session
    const emails = get_email_from_session(session);
    fastify.log.info(`Emails found in session: ${emails}, IP: ${request.headers["fastly-client-ip"]}, uuid: ${request.cookies.uuid}`);
    // If there are emails, try to find a user with one of them
    if (emails.length) {
      const [result, error] = await get_user(fastify.db, emails);
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
    fastify.log.info(`Codes found in session: ${codes}, IP: ${request.headers["fastly-client-ip"]}, uuid: ${request.cookies.uuid}`);
    if (codes.length>1) {
      fastify.log.info(`Multiple Codes found in session: ${codes}, IP: ${request.headers["fastly-client-ip"]}, uuid: ${request.cookies.uuid}`);
    }
    if (codes.length) {
      const subdomain = request.subdomain;
      fastify.log.info(`Subdomain found in request: ${subdomain}`);
      if (!SUBDOMAINS.student.includes(subdomain)) {
        const [sitecode, error] = await get_sitecode_by_subdomain(
          fastify.db,
          subdomain,
          codes,
        );
        if (error) {
          throw error;
        } else if (sitecode) {
          fastify.log.info(`Sitecode found for subdomain ${subdomain}: ${sitecode}`)
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
