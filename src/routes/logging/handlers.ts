import { ensure_error } from "../../utils/index.js";
import { LogPayload } from "../../event_handler/index.js";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export const logging_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "logging-api",
    };
    try {
      const log = request.body as LogPayload;
      fastify.event_logger.pep_standard_log_start(
        log.eventtype || "pep_frontend_log",
        request,
        {
          log_made_by: "jaip-frontend",
          ...log,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to create frontend log",
        },
        "logging",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
