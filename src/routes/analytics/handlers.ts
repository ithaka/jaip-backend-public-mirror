import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { LogPayload } from "../../event_handler/index.js";
import { get_json_from_s3, get_jaip_s3_url } from "../../utils/aws-s3.js";
import { ensure_error } from "../../utils/index.js";
import { ANALYTICS_S3_PATH } from "../../consts/index.js";

export const get_analytics_by_group_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { group_id: string };
    const group_id = params.group_id;

    const log_payload: LogPayload = {
      log_made_by: "analytics-api",
      event_description: `start to retrieve analytics for group ${params.group_id}`,
      group_id: group_id ? parseInt(group_id, 10) : 0,
    };

    fastify.event_logger.pep_standard_log_start(
      `pep_get_analytics_by_group_start`,
      request,
      {
        ...log_payload,
      },
    );

    try {
      if (!group_id) {
        const msg = `Group ID is required to retrieve analytics data`;
        reply.code(400).send(msg);
        fastify.event_logger.pep_error(
          request,
          reply,
          {
            event_description: msg,
          },
          "analytics-api",
          new Error(msg),
        );
        return;
      }

      // TODO: Add a check to see if analytics feature is enabled for this group
      // and if the user has the permission within that group.
      // See add_or_edit_entities_handler

      const path = get_jaip_s3_url(`${ANALYTICS_S3_PATH}/${group_id}`);
      const [s3_data, s3_error] = await get_json_from_s3(path);

      if (s3_error) {
        throw s3_error;
      }

      reply.code(200).send({ data: s3_data });

      fastify.event_logger.pep_standard_log_complete(
        `pep_get_analytics_by_group_complete`,
        request,
        reply,
        {
          ...log_payload,
          event_description: `successfully retrieved analytics data for group ${group_id}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      reply.code(500).send(error.message);

      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: `failed to retrieve analytics data for ${group_id}`,
        },
        "analytics",
        error,
      );
    }
  };
