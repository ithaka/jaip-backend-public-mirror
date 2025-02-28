import { FastifyReply, FastifyRequest } from "fastify";
import { manage_session, get_current_user } from "../auth/helpers";
import { ensure_error } from "../../utils";
import { User } from "../../types/entities";
import { Session } from "../../types/sessions";

declare module "fastify" {
  interface FastifyRequest {
    user: User;
    session: Session;
  }
}

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
    const [currentUser, user_error] = await get_current_user(
      request.server,
      request,
      session,
    );
    if (user_error) {
      throw user_error;
    }

    // This handler is only used on private routes which require authentication,
    // so if no user is returned we should return a 401
    if (!currentUser) {
      reply.code(401).send();
      return;
    }

    request.session = session;
    if (currentUser) {
      request.user = currentUser;
    }
  } catch (err) {
    const error = ensure_error(err);
    reply.code(500).send(error.message);
  }
};
