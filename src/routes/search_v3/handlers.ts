import { ensure_error } from "../../utils/index.js";
import { LogPayload } from "../../event_handler/index.js";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  SearchRequestBody,
  StatusSearchRequestBody,
} from "../../types/routes.js";
import {
  CONTRIBUTED_CONTENT_FLAG,
  FEATURES,
  SEARCH3,
  STATUS_OPTIONS,
} from "../../consts/index.js";
import { Search3Document, Search3Request } from "../../types/search.js";
import { jstor_types, status_options } from "@prisma/client";
import { Status } from "../../types/database.js";
import {
  do_search3,
  format_status_details,
  get_block_list_items,
  get_bulk_statuses,
  get_facility_statuses,
  get_snippets,
  get_status_keys,
  get_tokens,
  get_user_statuses,
} from "./helpers.js";
import { map_document } from "../queries/search.js";
import { History, MediaRecord } from "../../types/media_record.js";

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
      const {
        query,
        limit,
        pageNo,
        sort,
        facets,
        filters,
        contentTypes,
        isReentry,
      } = request.body;
      log_payload.search_request = request.body;
      const query_string = query || "";
      const page_mark = btoa(`pageMark=${pageNo}`);
      const search3_request: Search3Request = {
        query: query_string,
        limit,
        sort,
        page_mark,
        ...SEARCH3.queries.defaults,
        filter_queries: [...SEARCH3.queries.defaults.filter_queries],
        content_set_flags: [...SEARCH3.queries.defaults.content_set_flags],
      };

      // TODO: When this endpoint is ready for production, we will no longer want to
      // distinguish between prod and non-prod
      const is_prod = process.env.ENVIRONMENT === "prod";
      if (isReentry && !is_prod) {
        // Add the contributed content flag so we can retrieve contributed content
        search3_request.content_set_flags.push(CONTRIBUTED_CONTENT_FLAG);
        const [collection_ids, collection_id_error] =
          await fastify.db.get_collection_ids();
        if (collection_id_error) {
          throw collection_id_error;
        }
        // If there are collection IDs, we add them to the filter queries
        if (collection_ids.length) {
          const collection_id_filter = `collection_ids:(${collection_ids.join(" OR ")})`;
          search3_request.filter_queries.push(collection_id_filter);
        }
      }

      const full_groups = request.user.groups.filter((group) => {
        const groups =
          request.body.groups || request.user.groups.map((group) => group.id);
        return groups.includes(group.id);
      });
      const groups = full_groups.map((group) => group.id);
      log_payload.groups = groups;
      log_payload.full_groups = full_groups;

      search3_request.filter_queries = [...search3_request.filter_queries];
      // TODO: We're temporarily removing the date filter until we can
      // get the metadata for these items to work with search3 queries.
      filters.shift();
      for (const [i, filter] of filters.entries()) {
        for (const [key, value] of Object.entries(SEARCH3.queries.maps)) {
          if (filter.startsWith(key)) {
            filters[i] = `${value}:${filter.split(":")[1]}`;
          }
        }
      }
      search3_request.filter_queries.push(...filters);

      search3_request.ms_facet_fields = [];
      if (facets.length) {
        search3_request.ms_facet_fields.push(
          ...facets.map((facet) => {
            return {
              field: SEARCH3.queries.maps[facet],
              minCount: 1,
              limit: 10,
            };
          }),
        );
      }

      if (contentTypes?.length) {
        search3_request.ms_facet_fields = [
          {
            field: "cty",
            efq: contentTypes.map((ct) => Buffer.from(ct).toString("base64")),
          },
        ];
      }

      const [tokens, lv_tokens, token_error] = await get_tokens(
        fastify.db,
        request,
      );
      if (token_error) {
        throw token_error;
      }
      search3_request.tokens = tokens;
      // If this is a reentry search, we also add the limited visibility tokens
      if (isReentry && !is_prod) {
        search3_request.limited_visibility_tokens = lv_tokens;
      }

      log_payload.search3_request = search3_request;

      fastify.log.info(`Getting search3 host`);
      const [host, search_error] = await fastify.discover(SEARCH3.name);
      if (search_error) {
        throw search_error;
      }

      fastify.log.info(
        `Doing search3 request: ${JSON.stringify(search3_request)}`,
      );
      const [search_result, error] = await do_search3(
        host,
        search3_request,
        request.session.uuid,
      );
      if (error) {
        throw error;
      }

      // If there are no documents in the results from Search3, we can return early.
      if (!search_result?.data.total) {
        reply.send({
          docs: [],
          total: 0,
        });
        fastify.event_logger.pep_standard_log_complete(
          "pep_search_complete",
          request,
          reply,
          {
            ...log_payload,
            event_description:
              "search for documents complete. No documents found.",
          },
        );
        return;
      }

      fastify.log.info(`Attempting to retrieve status keys`);
      const { docs, dois, disc_and_journal_ids, ids, total } = get_status_keys(
        search_result!,
      );

      fastify.log.info(`Getting bulk statuses for ${disc_and_journal_ids}`);
      // Get the discipline/journal statuses and then the individual statuses, then snippets
      // We do not wait for these requests individually, because they can be done in parallel.
      const bulk_approval_promise = get_bulk_statuses(
        fastify.db,
        disc_and_journal_ids,
        groups,
      );

      fastify.log.info(`Getting global block list items for ${dois}.`);
      const block_list_promise = get_block_list_items(fastify.db, dois);

      fastify.log.info(
        `Getting document statuses for ${dois} in groups ${groups}. Is admin: ${request.is_authenticated_admin}`,
      );

      const document_statuses_promise = request.is_authenticated_admin
        ? get_user_statuses(fastify.db, dois, groups)
        : get_facility_statuses(fastify.db, dois, groups);

      const snippets_promise = get_snippets(
        fastify,
        ids,
        query || "",
        request.session.uuid,
      );

      // This is where we wait for all three requests to complete
      const all_requests = await Promise.allSettled([
        bulk_approval_promise,
        document_statuses_promise,
        snippets_promise,
        block_list_promise,
      ]);

      if (all_requests[0].status === "rejected") {
        throw all_requests[0].reason;
      }
      if (all_requests[1].status === "rejected") {
        throw all_requests[1].reason;
      }
      if (all_requests[2].status === "rejected") {
        throw all_requests[2].reason;
      }
      if (all_requests[3].status === "rejected") {
        throw all_requests[3].reason;
      }

      const [bulk_approval_statuses, bulk_approval_status_error] =
        all_requests[0].value;
      const [document_statuses, document_status_error] = all_requests[1].value;
      const [snippets, snippets_error] = all_requests[2].value;
      const [block_list_items, block_list_error] = all_requests[3].value;

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
      if (block_list_error) {
        throw block_list_error;
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

                const comments = curr.status_details?.find(
                  (detail) => detail.type === "comments",
                )?.detail;
                const reason = curr.status_details?.find(
                  (detail) => detail.type === "reason",
                )?.detail;

                acc[curr.groups.id] = {
                  status: curr.status,
                  statusLabel: label,
                  statusCreatedAt: curr.created_at!,
                  groupID: curr.groups.id,
                  groupName: curr.groups.name,
                  statusDetails: {
                    comments: comments || "",
                    reason: reason || "",
                  },
                };
              }
            }
            return acc;
          },
          {} as { [key: string]: History },
        );

        // Add the individual statuses
        const mediaReviewStatuses = {} as { [key: string]: History };
        for (const status of document_statuses[new_doc.doi] || []) {
          const status_details = format_status_details(status);
          const new_status: History = {
            status: status.status,
            statusLabel: status.status,
            statusDetails: status_details,
            statusCreatedAt: status.created_at!,
            groupID: status.groups?.id,
            groupName: status.groups?.name,
          };
          if (request.is_authenticated_admin) {
            new_status.entityName = status.entities?.name;
            new_status.entityID = status.entities?.id;
          }
          // We only need the first one, because they're already in descending order of created_at
          if (
            status.groups &&
            status.jstor_item_id === new_doc.doi &&
            !mediaReviewStatuses[status.groups.id] &&
            groups.includes(status.groups.id)
          ) {
            mediaReviewStatuses[status.groups.id] = new_status;
          }

          // This is where we'll include all of them in the history for admins.
          if (request.is_authenticated_admin) {
            if (!new_doc.history) {
              new_doc.history = [];
            }
            if (status.jstor_item_id === doc.doi) {
              new_doc.history.push(new_status);
            }
          }
        }
        // If there are individual statuses that are not bulk approval,
        // those should take precedence over the bulk approval statuses.
        if (Object.keys(mediaReviewStatuses).length > 0) {
          if (!new_doc.mediaReviewStatuses) {
            new_doc.mediaReviewStatuses = {};
          }
          for (const [group_id, status] of Object.entries(
            mediaReviewStatuses,
          )) {
            new_doc.mediaReviewStatuses[group_id] = status;
          }
        }

        // This occurs last, as it should override any statuses, either bulk or individual.
        if (
          block_list_items[doc.doi] &&
          request.user.groups.some(
            (group) => group.features[FEATURES.restricted_items_subscription],
          )
        ) {
          new_doc.mediaReviewStatuses = request.user.groups.reduce(
            (acc, group) => {
              // If the user belongs to a group that has the restricted items subscription feature,
              // we add a blocked status for that group.
              if (group.features[FEATURES.restricted_items_subscription]) {
                acc[group.id] = {
                  status: STATUS_OPTIONS.Restricted,
                  statusLabel: STATUS_OPTIONS.Restricted,
                  statusCreatedAt: block_list_items[doc.doi].created_at,
                  groupID: group.id,
                  groupName: group.name,
                  statusDetails: {
                    reason: block_list_items[doc.doi].reason || "",
                  },
                };
              }
              return acc;
            },
            {} as { [key: string]: History },
          );
          new_doc.is_restricted = true;
          new_doc.restricted_reason = block_list_items[doc.doi].reason || "";
        }

        // Attach the snippets, which are keyed by the id
        new_doc.snippets = snippets[doc.id];
        return_docs.push(new_doc);
      });

      if (request.body.dois && request.body.dois.length !== docs.length) {
        // If the number of dois from the statuses table does not match the number of
        // documents returned, we know that there's a mismatch. This log will help us
        // determine how prevalent that is.
        fastify.event_logger.pep_standard_log_complete(
          "pep_status_search_doi_mismatch",
          request,
          reply,
          {
            ...log_payload,
            event_description: "mismatch between dois and documents",
            dois: request.body.dois,
            dois_successfully_retrieved: docs.map((doc) => doc.doi),
          },
        );
      }
      const p = count / limit;
      const maxP = Math.ceil(p);
      let updated_total = total;
      if (count > 0 && (total >= limit || pageNo === maxP)) {
        updated_total = count;
      } else if (count > limit && total < limit) {
        updated_total = count;
      }

      // If we have a list of DOIs from the status search handler, we want the order of results
      // to consistently match that order. Otherwise, we return the documents in the order
      // they were returned from Search3.
      const sorted_return_docs =
        request.body.dois && request.body.dois.length
          ? request.body.dois
              .map((doi) => {
                return return_docs.find((doc) => doc.doi === doi);
              })
              .filter((doc) => doc !== undefined)
          : return_docs;

      reply.code(200).send({
        docs: sorted_return_docs,
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
