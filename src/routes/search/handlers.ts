import { ensure_error } from "../../utils";
import { LogPayload } from "../../event_handler";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export const search_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "search-api",
    };
    fastify.eventLogger.pep_standard_log_start("pep_search_start", request, {
      ...log_payload,
      event_description: "attempting to search",
    });
    try {
      console.log("This is where some code goes");
    } catch (err) {
      const error = ensure_error(err);
      fastify.eventLogger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to complete search",
        },
        "search",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
