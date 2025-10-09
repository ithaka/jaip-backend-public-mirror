import { ensure_error } from "../../utils/index.js";
import { LogPayload } from "../../event_handler/index.js";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { SUBDOMAINS } from "../../consts/index.js";

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
      return;
    }
    try {
      const [result, error] = await fastify.db.get_valid_subdomain(subdomain);
      if (error) {
        throw error;
      }
      if (!result) {
        reply.code(401);
        fastify.event_logger.pep_standard_log_complete(
          "pep_validate_subdomain_complete",
          request,
          reply,
          {
            ...log_payload,
            event_description: "no subdomains found in db",
          },
        );
        return;
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
