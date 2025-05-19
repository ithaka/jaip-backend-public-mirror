import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { SUBDOMAINS, ENTITY_TYPES } from "../../consts";
import { LogPayload } from "../../event_handler";
import { manage_session, get_current_user, get_email_from_session, get_code_from_session } from "./helpers";

export const auth_session_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "auth-api",
      event_description: "attempting to authenticate user",
    };
    fastify.event_logger.pep_standard_log_start("pep_auth_start", request, {
      ...log_payload,
      event_description: "attempting auth",
    });
    const [session, err] = await manage_session(fastify, request);
    if (err) {
      throw err;
    }
    log_payload.sessionid = session.uuid;
    fastify.log.info(`Getting current user from session ${session.uuid}`);
    const [current_user, error] = await get_current_user(
      fastify,
      request,
      get_email_from_session(session),
      get_code_from_session(session),
    );
    if (current_user) {
      current_user.uuid = session.uuid;
      log_payload.user = current_user;
    }
    if (error) {
      reply.code(500).send(error.message);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to authenticate user",
        },
        "auth",
        error,
      );
      return;
    } else if (!current_user) {
      reply.code(401).send();
      fastify.event_logger.pep_unauthorized_error(request, reply, log_payload);
      return;
    } else {
      const is_admin_subdomain = SUBDOMAINS.admin.includes(request.subdomain);
      if (is_admin_subdomain && current_user.type !== ENTITY_TYPES.USERS) {
        reply.code(403).send();
        fastify.event_logger.pep_forbidden_error(request, reply, log_payload);
        return;
      }
    }
    reply.code(200).send(current_user);
    fastify.event_logger.pep_standard_log_complete(
      "pep_auth_complete",
      request,
      reply,
      {
        ...log_payload,
        event_description: "user authenticated and authorized",
      },
    );
  };
