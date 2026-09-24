import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { PagesParams } from "../../types/routes.js";
import { LogPayload } from "../../event_handler/index.js";
import { ensure_error, user_has_feature } from "../../utils/index.js";
import {
  get_and_extract_metadata,
  get_entitlement_map,
  get_is_forbidden,
  get_md_from_cedar,
  get_page_url,
} from "./helpers.js";
import {
  attach_abortable_stream,
  get_s3_object,
  is_valid_byte_range,
} from "../../utils/aws-s3.js";
import { AxiosError } from "axios";
import { FEATURES } from "../../consts/index.js";
import { S3ServiceException } from "@aws-sdk/client-s3";

export { attach_abortable_stream } from "../../utils/aws-s3.js";

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
    fastify.event_logger.pep_standard_log_start(`pep_get_page_start`, request, {
      ...log_payload,
    });

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

      fastify.log.info(
        `Getting forbidden status for ${iid}. Is student: ${request.is_authenticated_student}`,
      );
      const is_forbidden = request.is_authenticated_student
        ? await get_is_forbidden(
            fastify.db,
            user_has_feature(
              request.user,
              FEATURES.restricted_items_subscription,
            ),
            doi,
            journal_iids,
            disc_codes,
            group_ids,
          )
        : false;

      fastify.log.info(`Is forbidden: ${is_forbidden}`);
      if (is_forbidden) {
        reply.code(403);
        fastify.event_logger.pep_forbidden_error(request, reply, {
          ...log_payload,
          event_description: `access to ${iid} is forbidden for group ${request.user.groups[0].id}`,
        });
        return;
      }

      fastify.log.info(`Getting page URL for ${iid}, page ${page}`);
      const [url, page_index] = get_page_url(cedar_item_view_data, page || "");

      fastify.log.info(`Page URL: ${url}`);
      log_payload.page_index = page_index;
      if (!url) {
        throw new Error(`Page ${page_index} not found for ${iid}`);
      }
      log_payload.page_path = url;
      fastify.log.info(`Getting S3 object for ${url}`);

      // Validate the requested byte range (if it exists) before fetching the S3 object.
      const is_valid_range = is_valid_byte_range(request.headers.range);
      if (is_valid_range instanceof Error) {
        throw is_valid_range;
      }
      const range = is_valid_range ? request.headers.range : undefined;

      // Fetch the S3 object using the validated byte range (if any).
      const [stream, s3_error, metadata] = await get_s3_object(url, range);
      if (s3_error) {
        throw s3_error;
      }

      // If no content range is returned, assume the entire object is being served. Using ranges is entirely
      // optional and depends on the client's request. The PDF viewer will be managing this on the frontend.
      if (metadata?.content_range) {
        reply.code(206);
        reply.header("content-range", metadata.content_range);
      }
      // Set the content length header if available.
      if (metadata?.content_length !== undefined) {
        reply.header("content-length", metadata.content_length);
      }
      // Set the accept-ranges header to indicate support for byte-range requests.
      reply.header("accept-ranges", metadata?.accept_ranges || "bytes");
      attach_abortable_stream(request, stream);
      await reply.type("application/pdf").send(stream);

      fastify.log.info(`Getting entitlement map for ${iid}`);
      const entitlement_map = await get_entitlement_map(
        fastify,
        iid,
        request.session.uuid,
      );
      log_payload.entitlement_mapping = entitlement_map;
      log_payload.referer = request.headers.referer;

      fastify.event_logger.pep_standard_log_complete(
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
      if (error instanceof AxiosError && error.status === 404) {
        reply.code(404).send("Metadata not found");
      } else if (
        error instanceof S3ServiceException &&
        error.$metadata.httpStatusCode === 404
      ) {
        reply.code(404).send("Item not found");
      } else if (
        (error instanceof S3ServiceException &&
          error.$metadata.httpStatusCode === 416) ||
        (error as unknown as { status_code?: number }).status_code === 416
      ) {
        reply.code(416).send("Requested range not satisfiable");
      } else {
        reply.code(500).send(error.message);
      }
      fastify.event_logger.pep_error(
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
    fastify.event_logger.pep_standard_log_start(
      `pep_get_metadata_start`,
      request,
      {
        ...log_payload,
      },
    );

    try {
      const group_ids = request.user.groups.map((group) => group.id);
      log_payload.full_groups = request.user.groups;

      fastify.log.info(`Getting metadata for ${iid}`);
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

      fastify.log.info(
        `Getting forbidden status for ${iid}. Is student: ${request.is_authenticated_student}`,
      );
      const is_forbidden = request.is_authenticated_student
        ? await get_is_forbidden(
            fastify.db,
            user_has_feature(
              request.user,
              FEATURES.restricted_items_subscription,
            ),
            doi,
            journal_iids,
            disc_codes,
            group_ids,
          )
        : false;

      fastify.log.info(`Is forbidden: ${is_forbidden}`);
      if (is_forbidden) {
        reply.code(403).send({ status: 403 });
        return_metadata.status = 403;
        fastify.event_logger.pep_forbidden_error(request, reply, {
          ...log_payload,
          event_description: `access to ${iid} is forbidden for group ${request.user.groups[0].id}`,
        });
        return;
      }

      fastify.log.info(`Getting entitlement map for ${iid}`);
      const entitlement_map = await get_entitlement_map(
        fastify,
        iid,
        request.session.uuid,
      );

      log_payload.entitlement_mapping = entitlement_map;

      reply.send(return_metadata);

      fastify.event_logger.pep_standard_log_complete(
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
      if (
        error instanceof AxiosError &&
        error.code === AxiosError.ERR_BAD_REQUEST
      ) {
        reply.code(404).send({ status: 404 });
      } else {
        reply.code(500).send(error.message);
      }
      fastify.event_logger.pep_error(
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
