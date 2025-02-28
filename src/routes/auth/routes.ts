import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { get_subdomain } from "../../utils";
import { route_schemas } from "./schemas";
import { SUBDOMAINS, ENTITY_TYPES } from "../../consts";
import { LogPayload } from "../../event_handler";
import { manage_session, get_current_user } from "./helpers";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.session;
  fastify.get("/auth/session", opts, async (request, reply) => {
    const log_payload: LogPayload = {
      log_made_by: "auth-api",
      event_description: "user authenticated and authorized",
    };
    fastify.eventLogger.pep_standard_log_start("pep_auth_start", request, {
      ...log_payload,
      event_description: "attempting auth",
    });
    const [session, err] = await manage_session(fastify, request);
    if (err) {
      throw err;
    }
    log_payload.sessionid = session.uuid;
    const [currentUser, error] = await get_current_user(
      fastify,
      request,
      session,
    );
    if (currentUser) {
      log_payload.user = currentUser;
    }
    if (error) {
      reply.code(500).send(error.message);
      fastify.eventLogger.pep_error(request, reply, log_payload, "auth", error);
      return;
    } else if (!currentUser) {
      reply.code(401).send();
      fastify.eventLogger.pep_unauthorized_error(request, reply, log_payload);
      return;
    } else {
      const subdomain = get_subdomain(request.headers.host || "");
      const is_admin_subdomain = SUBDOMAINS.admin.includes(subdomain);
      if (is_admin_subdomain && currentUser.type !== ENTITY_TYPES.users) {
        reply.code(403).send();
        fastify.eventLogger.pep_forbidden_error(request, reply, log_payload);
        return;
      }
    }
    fastify.eventLogger.pep_standard_log_complete(
      "pep_auth_complete",
      request,
      reply,
      {
        ...log_payload,
        event_description: "user authenticated and authorized",
      },
    );
    reply.code(200).send(currentUser);
  });
}

export default routes;
