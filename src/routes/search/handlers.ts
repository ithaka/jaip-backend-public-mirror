import { ensure_error } from "../../utils";
import { LogPayload } from "../../event_handler";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  SearchRequestBody,
  StatusParams,
  StatusSearchRequestBody,
} from "../../types/routes";
import { SEARCH3 } from "../../consts";
import { Search3Document, Search3Request } from "../../types/search";
import { jstor_types, Prisma, status_options } from "@prisma/client";
import { Status } from "../../types/database";
import {
  do_search3,
  get_bulk_statuses,
  get_facility_statuses,
  get_snippets,
  get_status_keys,
  get_tokens,
  get_user_statuses,
} from "./helpers";
import { map_document } from "../queries/search";
import { History, MediaRecord } from "../../types/media_record";

export const status_search_handler =
  (fastify: FastifyInstance) =>
  async (
    request: FastifyRequest<StatusSearchRequestBody>,
    reply: FastifyReply,
  ) => {
    const log_payload: LogPayload = {
      log_made_by: "search-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_status_search_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to search for statuses",
      },
    );
    try {
      const params = request.params as StatusParams;
      const status = params.status;
      const start_date = request.body.statusStartDate;
      const end_date = request.body.statusEndDate;

      const query_statuses: status_options[] = [];
      if (status === "complete") {
        query_statuses.push(status_options.Approved, status_options.Denied);
      } else {
        const capitalized = status.charAt(0).toUpperCase() + status.slice(1);
        const option =
          status_options[capitalized as keyof typeof status_options];
        if (!option) {
          reply.code(400).send("Invalid status parameter");
          fastify.event_logger.pep_bad_request_error(request, reply, {
            ...log_payload,
            event_description: "failed to complete search for statuses",
          });
        }
        query_statuses.push(option);
      }

      const groups = request.body.groups || [];

      const query: Prisma.statusesFindManyArgs = {
        where: {
          status: {
            in: query_statuses,
          },
          jstor_item_type: jstor_types.doi,
          group_id: {
            in: groups,
          },
          created_at: {
            gte: start_date,
            lte: end_date,
          },
        },
        skip: request.body.limit * (request.body.pageNo - 1),
        take: request.body.limit,
        orderBy: {
          created_at: "desc",
        },
      };

      // If the a search query is included and the user is an admin, we'll
      // search the status details and entities as well.
      const query_string = request.body.statusQuery;
      if (query_string && request.is_authenticated_admin) {
        query.where!.OR = [
          {
            jstor_item_id: {
              contains: query_string,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            status_details: {
              some: {
                detail: {
                  contains: query_string,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          },
          {
            entities: {
              name: {
                contains: query_string,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
          {
            entities: {
              users: {
                jstor_id: {
                  contains: query_string,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          },
        ];
      }

      const [statuses, count] = await fastify.prisma.$transaction([
        fastify.prisma.statuses.findMany(query),
        fastify.prisma.statuses.count({ where: query.where }),
      ]);

      let doi_filter = "(";
      for (const [index, status] of statuses.entries()) {
        doi_filter += `doi:${status.jstor_item_id}`;
        if (index < statuses.length - 1) {
          doi_filter += " OR ";
        }
      }
      doi_filter += ")";

      request.body.filters.push(doi_filter);

      // We need to clear the existing query now that we've used it to get statuses from the
      // database. The request will now be used to build a request for Search3 that won't
      // use a query.
      request.body.query = "";
      await search_handler(fastify, count)(request, reply);

      fastify.event_logger.pep_standard_log_complete(
        "pep_status_search_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: "search for documents by status complete",
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to complete search for statuses",
        },
        "search",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const search_handler =
  (fastify: FastifyInstance, count: number) =>
  async (
    request: FastifyRequest<SearchRequestBody | StatusSearchRequestBody>,
    reply: FastifyReply,
  ) => {
    const log_payload: LogPayload = {
      log_made_by: "search-api",
    };
    fastify.event_logger.pep_standard_log_start("pep_search_start", request, {
      ...log_payload,
      full_groups: request.user.groups,
      event_description: "attempting to search by query",
    });
    try {
      const { query, limit, pageNo, sort, facets, filters, statusQuery } =
        request.body;
      log_payload.search_request = request.body;
      const query_string = query || statusQuery || "";
      const page_mark = btoa(`pageMark=${pageNo}`);
      const search3_request: Search3Request = {
        query: query_string,
        limit,
        sort,
        page_mark,
        ...SEARCH3.queries.defaults,
      };

      search3_request.filter_queries = [...search3_request.filter_queries];
      for (const [i, filter] of filters.entries()) {
        for (const [key, value] of Object.entries(SEARCH3.queries.maps)) {
          if (filter.startsWith(key)) {
            filters[i] = `${value}:${filter.split(":")[1]}`;
          }
        }
      }
      search3_request.filter_queries.push(...filters);

      if (facets.length) {
        search3_request.ms_facet_fields = facets.map((facet) => {
          return {
            field: SEARCH3.queries.maps[facet],
            minCount: 1,
            limit: 10,
          };
        });
      }

      const [tokens, token_error] = await get_tokens(fastify.prisma, request);
      if (token_error) {
        throw token_error;
      }
      search3_request.tokens = tokens;

      log_payload.search3_request = search3_request;

      const [host, search_error] = await fastify.discover(SEARCH3.name);
      if (search_error) {
        throw search_error;
      }

      const [search_result, error] = await do_search3(
        host,
        search3_request,
        request.session.uuid,
      );
      if (error) {
        throw error;
      }

      const { docs, dois, disc_and_journal_ids, ids, total } = get_status_keys(
        search_result!,
      );

      // Get the discipline/journal statuses and then the individual statuses, then snippets
      // We do not wait for these requests individually, because they can be done in parallel.
      const bulk_approval_promise = get_bulk_statuses(
        fastify.prisma,
        disc_and_journal_ids,
        request.user.groups.map((group) => group.id),
      );
      const document_statuses_promise = request.is_authenticated_admin
        ? get_user_statuses(fastify.prisma, dois)
        : get_facility_statuses(
            fastify.prisma,
            dois,
            request.user.groups.map((group) => group.id),
          );
      const snippets_promise = get_snippets(
        fastify,
        ids,
        query || "",
        request.session.uuid,
      );

      // This is where we wait for all three requests to complete
      const all_requests = await Promise.all([
        bulk_approval_promise,
        document_statuses_promise,
        snippets_promise,
      ]);
      const [bulk_approval_statuses, bulk_approval_status_error] =
        all_requests[0];
      const [document_statuses, document_status_error] = all_requests[1];
      const [snippets, snippets_error] = all_requests[2];

      // Handle errors. We'll just take them one at a time. If multiple requests fail,
      // we'll only log the first one.
      if (bulk_approval_status_error) {
        throw bulk_approval_status_error;
      }
      if (document_status_error) {
        throw document_status_error;
      }
      if (snippets_error) {
        throw snippets_error;
      }

      const return_docs: MediaRecord[] = [];
      // Iterate through the documents and add the statuses and snippets
      docs.forEach((doc: Search3Document) => {
        const new_doc = map_document(doc);
        // Start with bulk approval, which will be overridden by individual statuses
        new_doc.mediaReviewStatuses = bulk_approval_statuses.reduce(
          (acc, curr: Status) => {
            if (curr.groups && curr.status === status_options.Approved) {
              const is_journal_match =
                curr.jstor_item_type === jstor_types.headid &&
                doc.additional_fields.headid?.includes(
                  curr.jstor_item_id ?? "",
                );
              const is_discipline_match =
                curr.jstor_item_type === jstor_types.discipline &&
                doc.additional_fields.disc_str?.includes(
                  curr.jstor_item_id ?? "",
                );
              if (is_journal_match || is_discipline_match) {
                const label = is_journal_match
                  ? `${status_options.Approved} by Journal`
                  : `${status_options.Approved} by Discipline`;
                acc[curr.groups.id] = {
                  ...curr,
                  statusLabel: label,
                  statusCreatedAt: curr.created_at,
                  groupID: curr.groups.id,
                  groupName: curr.groups.name,
                };
              }
            }
            return acc;
          },
          {} as { [key: string]: History },
        );

        // Add the individual statuses
        const mediaReviewStatuses = {} as { [key: string]: Status };
        for (const status of document_statuses[new_doc.doi] || []) {
          const new_status: History = {
            ...status,
            statusLabel: status.status,
            statusCreatedAt: status.created_at,
            groupID: status.groups?.id,
            groupName: status.groups?.name,
          };
          // We only need the first one, because they're already in descending order of created_at
          if (
            status.groups &&
            status.jstor_item_id === new_doc.doi &&
            !mediaReviewStatuses[status.groups.id]
          ) {
            mediaReviewStatuses[status.groups.id] = status;
          }

          // This is where we'll include all of them in the history. We'll only have the most recent
          // for facilities (this selection is handled in the db query), but admins get the whole history.
          if (!new_doc.history) {
            new_doc.history = [];
          }
          if (status.jstor_item_id === doc.doi) {
            new_doc.history.push(new_status);
          }
        }

        // Attach the snippets, which are keyed by the id
        new_doc.snippets = snippets[doc.id];

        return_docs.push(new_doc);
      });

      const p = count / limit;
      const maxP = Math.ceil(p);
      let updated_total = total;
      if (count > 0 && (total >= limit || pageNo === maxP)) {
        updated_total = count;
      } else if (count > limit && total < limit) {
        updated_total = count;
      }

      reply.code(200).send({
        docs: return_docs,
        total: updated_total,
      });
      fastify.event_logger.pep_standard_log_complete(
        "pep_search_complete",
        request,
        reply,
        {
          ...log_payload,
          event_description: "search for documents complete",
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
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
