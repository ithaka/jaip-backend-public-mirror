import { ensure_error, get_subdomain } from "../../utils";
import { LogPayload } from "../../event_handler";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export const subdomain_validation_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "subdomains-api",
    };
    fastify.eventLogger.pep_standard_log_start(
      "pep_validate_subdomain_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to get subdomains",
      },
    );
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
      if (!result) {
        throw new Error("Subdomain not found");
      }
      reply.send(result);
      fastify.eventLogger.pep_standard_log_complete(
        "pep_validate_subdomain_complete",
        request,
        reply,
        {
          db_subdomain: result.subdomain,
          ...log_payload,
          event_description: "returning subdomains from db",
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.eventLogger.pep_error(request, reply, {}, "subdomains", error);
      reply.code(500).send(error.message);
    }
  };
