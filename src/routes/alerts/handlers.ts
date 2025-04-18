import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { LogPayload } from "../../event_handler";
import { ensure_error } from "../../utils";

export const alerts_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "alerts-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_get_alerts_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to get alerts",
      },
    );
    try {
      const [result, error] = await fastify.db.get_alerts();
      if (error) {
        throw error;
      }

      if (!result || !result.text || !result.status) {
        reply.code(204);
        log_payload.event_description = "no alerts found";
      } else {
        log_payload.alert_text = result.text;
        log_payload.alert_status = result.status;
        log_payload.event_description = "returning latest alert from db";
      }
      reply.send(result);
      fastify.event_logger.pep_standard_log_complete(
        "pep_get_alerts_complete",
        request,
        reply,
        log_payload,
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to retrieve alerts",
        },
        "alerts",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
