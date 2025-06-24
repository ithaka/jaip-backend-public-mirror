import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ensure_error } from "../../utils";
import { LogPayload } from "../../event_handler";
import {
  BlockItem,
  UnblockItem,
} from "../../types/routes";

export const block_handler = (
  fastify: FastifyInstance) => {
  return async (
    request: FastifyRequest<BlockItem>,
    reply: FastifyReply,
  ) => {
    const log_payload: LogPayload = {
      log_made_by: "global-blocks-api",
    };
    fastify.event_logger.pep_standard_log_start(
      `pep_global_block_start`,
      request,
      {
        ...log_payload,
        event_description: `attempting to add a blocked item`,
      },
    );
    try {
      const doi = request.body.doi;
      const reason = request.body.reason;
      log_payload.doi = doi;
      log_payload.reason = reason;

      fastify.log.info(`Creating block for ${doi} with reason: ${reason}`);
      const error = await fastify.db.create_blocked_item(
        doi,
        reason,
        request.user.id!,
      );
      if (error) throw error;

      fastify.event_logger.pep_standard_log_complete(
        `pep_global_block_complete`,
        request,
        reply,
        {
          ...log_payload,
          event_description: `completed blocking for doi: ${doi}`,
        },
      );
      reply.code(201);
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: `failed to block item`,
        },
        "block",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
};

export const unblock_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<UnblockItem>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "global-blocks-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_unblock_start",
      request,
      {
        ...log_payload,
        event_description: "attempting unblock item",
      },
    );
    try {
      const doi = request.body.doi;
      // Because requests come from facilities, we can assume that there is only one group
      log_payload.doi = doi;

      

      fastify.log.info(`Unblocking item ${doi}`);
      const error = await fastify.db.remove_blocked_item(doi, request.user.id!);
      if (error) throw error;

      fastify.event_logger.pep_standard_log_complete(
        "pep_unblock_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `unblock completed for doi: ${doi}`,
        },
      );
      reply.code(201);
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to unblock item",
        },
        "request",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

