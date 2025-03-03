import { FastifyReply, FastifyRequest, RequirementsSchema } from "fastify";
import { manage_session, get_current_user } from "../auth/helpers";
import { ensure_error } from "../../utils";
import { User } from "../../types/entities";
import { Session } from "../../types/sessions";
import { user_has_feature } from "../../utils/features";
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

export const requirements_guard = async (
  request: FastifyRequest,
  reply: FastifyReply,
  // requires: { any?: string[]; all?: string[] },
) => {
  const schema = request.routeOptions.schema as RequirementsSchema;

  if (schema?.requires?.any && schema?.requires?.any.length) {
    const any = schema.requires.any;
    let has_feature = false;
    console.log(request.user);

    for (const feature of any) {
      console.log(feature, user_has_feature(request.user, feature));

      if (user_has_feature(request.user, feature)) {
        has_feature = true;
        break;
      }
    }
    if (!has_feature) {
      reply.code(403).send();
      return;
    } else {
      return;
    }
  }
};
