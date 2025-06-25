import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ensure_error } from "../../utils";
import { LogPayload } from "../../event_handler";
import { BlockItem, GetBlockedItemsBody, UnblockItem } from "../../types/routes";
import { SearchRequest } from "../../types/search";
import { search_handler } from "../search/handlers";

export const get_blocked_items_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<GetBlockedItemsBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "global-blocks-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_get_blocked_items_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to get blocked items",
      },
    );

    const term = request.body.term || "";
    const page = request.body.page;
    const limit = request.body.limit;

    try {
      const [blocked_items, count, error] = await fastify.db.get_blocked_items_and_count(
        term,
        page,
        limit,
      );
      if (error) {
        throw error;
      }

      const dois = blocked_items.map((item) => item.jstor_item_id);
      let doi_filter = "(";
      dois.forEach((doi, index) => {
        doi_filter += `doi:"${doi}"`;
        if (index < dois.length - 1) {
          doi_filter += " OR ";
        }
      });
      doi_filter += ")";

      if (!dois.length) {
        reply.send({
          docs: [],
          total: 0,
        });
        fastify.event_logger.pep_standard_log_complete(
          "pep_get_blocked_items_complete",
          request,
          reply,
          {
            dois: blocked_items.map((item) => item.jstor_item_id),
            total: count,
            ...log_payload,
            event_description: "no blocked items found in db",
          },
        );
        return
      }
      const search_request_body = {
        query: "",
        pageNo: 1,
        limit: request.body.limit,
        sort: "new",
        facets: ['contentType', 'disciplines'],
        filters: dois.length ? [doi_filter] :  [],
        dois: dois.length ? dois : undefined,
      } as SearchRequest


      const new_request = {
        ...request,
        routeOptions: request.routeOptions || {},
        headers: {
          ...request.headers,
        },
        body: search_request_body,
      }
      await search_handler(fastify, count || 0)(new_request, reply);
      
      fastify.event_logger.pep_standard_log_complete(
        "pep_get_blocked_items_complete",
        request,
        reply,
        {
          dois: blocked_items.map((item) => item.jstor_item_id),
          total: count,
          ...log_payload,
          event_description: "returning blocked items from db",
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to get blocked items",
        },
        "get_blocked_items",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const block_handler = (fastify: FastifyInstance) => {
  return async (request: FastifyRequest<BlockItem>, reply: FastifyReply) => {
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
    fastify.event_logger.pep_standard_log_start("pep_unblock_start", request, {
      ...log_payload,
      event_description: "attempting unblock item",
    });
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
        "unblock",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
