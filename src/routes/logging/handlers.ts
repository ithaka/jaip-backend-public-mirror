import { ensure_error } from "../../utils/index.js";
import { LogPayload } from "../../event_handler/index.js";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { FRONTEND_LOG_EVENTS } from "../../consts/index.js";

export const logging_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "logging-api",
    };
    try {
      const log = request.body as LogPayload;

      // NOTE: We've had some bot attacks using the logging endpoint,
      // so we're adding some validation to ensure that only valid logs are accepted.
      // If eventtype is not provided, return a 400 error and log the attempt
      if (!log.eventtype) {
        reply.code(400).send("eventtype is required in log payload");
        fastify.event_logger.pep_standard_log_start(
          "pep_fe_missing_eventtype",
          request,
          {
            log_made_by: "jaip-frontend",
            event_description: "missing eventtype in log payload",
          },
        );
        return;
      }

      // If eventtype is not in the allowed list, return a 401 error and log the attempt
      if (!FRONTEND_LOG_EVENTS.includes(log.eventtype)) {
        reply.code(401).send("eventtype not allowed");
        fastify.event_logger.pep_standard_log_start(
          "pep_fe_unauthorized_log_attempt",
          request,
          {
            log_made_by: "jaip-frontend",
            event_description: `unauthorized log attempt with eventtype ${JSON.stringify(log.eventtype)}`,
          },
        );
        return;
      }
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
