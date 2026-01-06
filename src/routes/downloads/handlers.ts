import { ensure_error } from "../../utils/index.js";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { LogPayload } from "../../event_handler/index.js";
import { OfflineIndexParams } from "../../types/routes.js";
import { OFFLINE_INDICES } from "../../consts/index.js";
import { get_presigned_url } from "../pages/helpers.js";

/**
 * Handler for offline index downloads
 * Redirects to a presigned S3 URL for the requested offline index ZIP file
 * @param fastify - Fastify instance
 * @returns Fastify handler function
 */
export const download_offline_index_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as OfflineIndexParams;
    const index_id = params.index_id;
    const path = OFFLINE_INDICES[index_id];

    if (!path) {
      reply.code(400).send({ error: `Invalid index id: ${index_id}` });
      return;
    }

    const log_payload: LogPayload = {
      log_made_by: "download-offline-index-api",
      event_description: `Attempting to retrieve file for ${index_id}`,
    };

    fastify.event_logger.pep_standard_log_start(
      `pep_download_offline_index_start`,
      request,
      { ...log_payload },
    );

    try {
      const [url, s3_error] = await get_presigned_url(path);
      if (s3_error || !url) {
        throw s3_error;
      }

      reply.redirect(url);

      fastify.event_logger.pep_standard_log_complete(
        `pep_download_offline_index_complete`,
        request,
        reply,
        {
          ...log_payload,
          event_description: `successfully generated download URL for ${index_id}`,
          download_path: path,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.log.error(`⛑️ Error in download_offline_index_handler: ${error}`);

      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: `Error retrieving offline index file for ${index_id}: ${error.message}`,
        },
        `pep_download_offline_index_error`,
        error,
      );

      reply.code(500).send({ error: error.message });
    }
  };
