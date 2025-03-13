import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { PagesParams } from "../../types/routes";
import { LogPayload } from "../../event_handler";
import { ensure_error } from "../../utils";
import {
  get_and_extract_metadata,
  get_entitlement_map,
  get_is_forbidden,
  get_md_from_cedar,
  get_page_url,
  get_s3_object,
} from "./helpers";

export const page_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as PagesParams;
    const iid = params.iid;
    const page = params.page;

    const log_payload: LogPayload = {
      log_made_by: "pages-api",
      event_description: page
        ? `attempting to retrieve page ${page} for ${iid}`
        : `attempting to retrieve pdf for ${iid}`,
      iid,
      page,
    };
    fastify.eventLogger.pep_standard_log_start(
      `pep_get_metadata_start`,
      request,
      {
        ...log_payload,
      },
    );

    try {
      const group_ids = request.user.groups.map((group) => group.id);
      log_payload.full_groups = request.user.groups;

      const extracts = await get_and_extract_metadata(
        fastify,
        iid,
        log_payload,
      );
      if (extracts instanceof Error) {
        throw extracts;
      }
      const { doi, journal_iids, disc_codes, cedar_item_view_data } = extracts;

      const is_forbidden = await get_is_forbidden(
        fastify.prisma,
        request.is_authenticated_student,
        doi,
        journal_iids,
        disc_codes,
        group_ids,
      );

      if (is_forbidden) {
        reply.code(403);
        fastify.eventLogger.pep_forbidden_error(request, reply, {
          ...log_payload,
          event_description: `access to ${iid} is forbidden for group ${request.user.groups[0].id}`,
        });
        return;
      }

      const [url, page_index] = get_page_url(cedar_item_view_data, page || "");
      log_payload.page_index = page_index;
      if (!url) {
        throw new Error(`Page ${page_index} not found for ${iid}`);
      }
      log_payload.page_path = url;
      const [stream, s3_error] = await get_s3_object(url);
      if (s3_error) {
        throw s3_error;
      }
      reply.send(stream);

      const entitlement_map = await get_entitlement_map(
        fastify,
        iid,
        request.session.uuid,
      );
      log_payload.entitlement_mapping = entitlement_map;
      log_payload.referer = request.headers.referer;

      fastify.eventLogger.pep_standard_log_complete(
        `pep_get_page_complete`,
        request,
        reply,
        {
          ...log_payload,
          event_description: page_index
            ? `successfully retrieved page ${page_index} for ${iid}`
            : `successfully retrieved pdf for ${iid}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      reply.code(500).send(error.message);
      fastify.eventLogger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: page
            ? `failed to retrieve page ${page} for ${iid}`
            : `failed to retrieve pdf for ${iid}`,
        },
        "pages",
        error,
      );
    }
  };

export const metadata_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as PagesParams;
    const iid = params.iid;

    const log_payload: LogPayload = {
      log_made_by: "pages-api",
      event_description: `attempting to retrieve metadata for ${iid}`,
      iid,
    };
    fastify.eventLogger.pep_standard_log_start(
      `pep_get_metadata_start`,
      request,
      {
        ...log_payload,
      },
    );

    try {
      const group_ids = request.user.groups.map((group) => group.id);
      log_payload.full_groups = request.user.groups;

      const extracts = await get_and_extract_metadata(
        fastify,
        iid,
        log_payload,
      );
      if (extracts instanceof Error) {
        throw extracts;
      }
      const { doi, journal_iids, disc_codes, cedar_item_view_data } = extracts;

      const return_metadata = get_md_from_cedar(cedar_item_view_data, {
        itemType: "",
        contentType: "",
        isRightToLeft: false,
        pageCount: 0,
        status: 200,
      });

      const is_forbidden = await get_is_forbidden(
        fastify.prisma,
        request.is_authenticated_student,
        doi,
        journal_iids,
        disc_codes,
        group_ids,
      );

      if (is_forbidden) {
        reply.code(403);
        return_metadata.status = 403;
        fastify.eventLogger.pep_forbidden_error(request, reply, {
          ...log_payload,
          event_description: `access to ${iid} is forbidden for group ${request.user.groups[0].id}`,
        });
      }

      const entitlement_map = await get_entitlement_map(
        fastify,
        iid,
        request.session.uuid,
      );

      log_payload.entitlement_mapping = entitlement_map;

      reply.send(return_metadata);

      fastify.eventLogger.pep_standard_log_complete(
        `pep_get_metadata_complete`,
        request,
        reply,
        {
          ...log_payload,
          event_description: `successfully retrieved metadata for ${iid}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      reply.code(500).send(error.message);
      fastify.eventLogger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: `failed to retrieve metadata for ${iid}`,
        },
        "pages",
        error,
      );
    }
  };
