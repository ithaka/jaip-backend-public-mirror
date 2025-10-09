import { ensure_error } from "../../utils/index.js";
import { LogPayload } from "../../event_handler/index.js";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { OfflineIndexParams } from "../../types/routes.js";
import { OFFLINE_INDICES } from "../../consts/index.js";

export const download_offline_index_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "downloads-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_download_offline_index_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to download an offline index",
      },
    );

    const params = request.params as OfflineIndexParams;
    const index_id = params.index_id;
    const path = OFFLINE_INDICES[index_id];
    log_payload.download_path = path;
    // TODO: Implement the download function

    try {
      reply.code(302).send();
      fastify.event_logger.pep_standard_log_complete(
        "pep_download_offline_index_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: "returning pre-signed URL for offline index",
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to return URL for offline index",
        },
        "downloads",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
