import { ensure_error } from "../../utils";
import { LogPayload } from "../../event_handler";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export const environment_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "environment-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_get_environment_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to get environment",
      },
    );
    try {
      reply.send({
        environment: process.env.ENVIRONMENT,
      });
      fastify.event_logger.pep_standard_log_complete(
        "pep_validate_subdomain_complete",
        request,
        reply,
        {
          environment: process.env.ENVIRONMENT,
          ...log_payload,
          event_description: "returning subdomain in valid list",
        },
      );
      return;
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to retrieve environment",
        },
        "environment",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
