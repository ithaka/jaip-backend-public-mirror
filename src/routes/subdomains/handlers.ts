import { ensure_error } from "../../utils";
import { LogPayload } from "../../event_handler";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { SUBDOMAINS } from "../../consts";

export const subdomain_validation_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "subdomains-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_validate_subdomain_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to validate subdomains",
      },
    );
    const subdomain = request.subdomain;
    if (
      SUBDOMAINS.student.includes(subdomain) ||
      SUBDOMAINS.admin.includes(subdomain)
    ) {
      reply.send({ subdomain });
      fastify.event_logger.pep_standard_log_complete(
        "pep_validate_subdomain_complete",
        request,
        reply,
        {
          db_subdomain: subdomain,
          ...log_payload,
          event_description: "returning subdomain in valid list",
        },
      );
    }
    try {
      const [result, error] = await fastify.db.get_valid_subdomain({
        where: {
          subdomain,
          is_active: true,
        },
        select: {
          subdomain: true,
        },
      });
      if (error) {
        throw error;
      }
      if (!result) {
        throw new Error("Subdomain not found");
      }
      reply.send(result);
      fastify.event_logger.pep_standard_log_complete(
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
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to validate subdomain",
        },
        "subdomains",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
