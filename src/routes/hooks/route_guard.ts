import { FastifyReply, FastifyRequest } from "fastify";
import {
  manage_session,
  get_current_user,
  get_email_from_session,
  get_code_from_session,
} from "../auth/helpers";
import { ensure_error } from "../../utils";
import { SUBDOMAINS } from "../../consts";

export const route_guard = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const [session, session_error] = await manage_session(
      request.server,
      request,
    );
    if (session_error) {
      throw session_error;
    }
    const [current_user, user_error] = await get_current_user(
      request.server,
      request,
      get_email_from_session(session),
      get_code_from_session(session),
    );
    if (user_error) {
      throw user_error;
    }

    // This handler is only used on private routes which require authentication,
    // so if no user is returned we should return a 401
    if (!current_user) {
      reply.code(401).send();
      return;
    }

    request.session = session;
    if (current_user) {
      request.user = current_user;
      request.is_authenticated_admin =
        SUBDOMAINS.admin.includes(request.subdomain) &&
        request.user.type === "users";
      request.is_authenticated_student =
        SUBDOMAINS.student.includes(request.subdomain) &&
        request.user.type === "facilities";
    }
  } catch (err) {
    const error = ensure_error(err);
    request.server.event_logger.pep_server_error(request, error);
    reply.code(500).send(error.message);
  }
};
