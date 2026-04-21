import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { LogPayload } from "../../event_handler/index.js";
import { SUBDOMAINS } from "../../consts/index.js";

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
    // This value is set in the route_guard hook, which runs before this handler.
    // If the user is authenticated, request.user will be populated with their JAIP user information.
    // If they are not authenticated, request.user will be undefined.
    const current_user = request.user;
    if (current_user) {
      // If the user is authenticated and trying to access an admin subdomain,
      // we check that they have the appropriate admin role before allowing them to proceed.
      const is_admin_subdomain = SUBDOMAINS.admin.includes(request.subdomain);
      if (is_admin_subdomain && !request.is_authenticated_admin) {
        reply.code(403).send();
        fastify.event_logger.pep_forbidden_error(request, reply, log_payload);
        return;
      }

      reply.code(200).send(request.user);

      fastify.event_logger.pep_standard_log_complete(
        "pep_auth_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: "user authenticated and authorized",
        },
      );
    } else {
      // If there is no user associated with the request, we return a 401 Unauthorized response.
      reply.code(401);
      fastify.event_logger.pep_unauthorized_error(request, reply, log_payload);
    }
  };
