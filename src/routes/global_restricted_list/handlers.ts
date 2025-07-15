import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ensure_error } from "../../utils";
import { LogPayload } from "../../event_handler";
import { RestrictItem, GetRestrictedItemsBody, UnrestrictItem } from "../../types/routes";
import { SearchRequest } from "../../types/search";
import { search_handler } from "../search/handlers";

export const get_restricted_items_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<GetRestrictedItemsBody>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "global-restricted-list-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_get_restricted_items_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to get restricted items",
      },
    );

    const term = request.body.query || "";
    const page = request.body.pageNo || 1;
    const limit = request.body.limit;
    const start_date = request.body.statusStartDate || new Date("January 1, 2022");
    const end_date = request.body.statusEndDate || new Date(new Date().setDate(new Date().getDate() + 1));
    const sort = request.body.sort || "new";

    try {
      const [restricted_items, count, error] = await fastify.db.get_restricted_items_and_count(
        term,
        page,
        limit,
        start_date,
        end_date,
        sort
      );
      if (error) {
        throw error;
      }

      const dois = restricted_items.map((item) => item.jstor_item_id);
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
          "pep_get_restricted_items_complete",
          request,
          reply,
          {
            dois: restricted_items.map((item) => item.jstor_item_id),
            total: count,
            ...log_payload,
            event_description: "no restricted items found in db",
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
        "pep_get_restricted_items_complete",
        request,
        reply,
        {
          dois: restricted_items.map((item) => item.jstor_item_id),
          total: count,
          ...log_payload,
          event_description: "returning restricted items from db",
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to get restricted items",
        },
        "get_restricted_items",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const restrict_handler = (fastify: FastifyInstance) => {
  return async (request: FastifyRequest<RestrictItem>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "global-restricted-list-api",
    };
    fastify.event_logger.pep_standard_log_start(
      `pep_global_restrict_start`,
      request,
      {
        ...log_payload,
        event_description: `attempting to add a restricted item`,
      },
    );
    try {
      const doi = request.body.doi;
      const reason = request.body.reason;
      log_payload.doi = doi;
      log_payload.reason = reason;

      fastify.log.info(`Creating restricted item for ${doi} with reason: ${reason}`);
      const error = await fastify.db.create_restricted_item(
        doi,
        reason,
        request.user.id!,
      );
      if (error) throw error;

      fastify.event_logger.pep_standard_log_complete(
        `pep_global_restrict_complete`,
        request,
        reply,
        {
          ...log_payload,
          event_description: `completed restricting for doi: ${doi}`,
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
          event_description: `failed to restrict item`,
        },
        "restrict",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
};

export const unrestrict_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest<UnrestrictItem>, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "global-restricted-items-api",
    };
    fastify.event_logger.pep_standard_log_start("pep_unrestrict_start", request, {
      ...log_payload,
      event_description: "attempting unrestrict item",
    });
    try {
      const doi = request.body.doi;
      // Because requests come from facilities, we can assume that there is only one group
      log_payload.doi = doi;

      fastify.log.info(`Unrestricting item ${doi}`);
      const error = await fastify.db.remove_restricted_item(doi, request.user.id!);
      if (error) throw error;

      fastify.event_logger.pep_standard_log_complete(
        "pep_unrestrict_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: `unrestrict completed for doi: ${doi}`,
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
          event_description: "failed to unrestrict item",
        },
        "unrestrict",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
