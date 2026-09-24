import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CustomContentParams } from "../../types/routes.js";
import { LogPayload } from "../../event_handler/index.js";
import { ensure_error } from "../../utils/index.js";
import { AxiosError } from "axios";
import {
  CUSTOM_CONTENT_METADATA,
  CUSTOM_CONTENT_S3_PATH,
} from "../../consts/index.js";
import {
  attach_abortable_stream,
  get_s3_object,
  get_jaip_s3_url,
  is_valid_byte_range,
} from "../../utils/aws-s3.js";
import { S3ServiceException } from "@aws-sdk/client-s3";

export const get_metadata_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as CustomContentParams;
    const collection = params.collection;

    const log_payload: LogPayload = {
      log_made_by: "custom-content-api",
      event_description: `attempting to retrieve metadata for ${collection}`,
      collection,
    };
    fastify.event_logger.pep_standard_log_start(
      `pep_get_custom_content_metadata_start`,
      request,
      {
        ...log_payload,
      },
    );

    try {
      if (!CUSTOM_CONTENT_METADATA[collection]) {
        const msg = `Collection metadata not found for ${collection}`;
        reply.code(400).send(msg);
        fastify.event_logger.pep_error(
          request,
          reply,
          {
            event_description: msg,
          },
          "custom_content",
          new Error(msg),
        );
        return;
      }
      reply.send(CUSTOM_CONTENT_METADATA[collection]);

      fastify.event_logger.pep_standard_log_complete(
        `pep_get_custom_content_metadata_complete`,
        request,
        reply,
        {
          ...log_payload,
          event_description: `successfully retrieved metadata for ${collection}`,
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
          event_description: `failed to retrieve metadata for ${collection}`,
        },
        "custom_content",
        error,
      );
    }
  };

export const pdf_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as CustomContentParams;
    const collection = params.collection;
    const filename = params.filename;

    const log_payload: LogPayload = {
      log_made_by: "custom-content-api",
      event_description: `attempting to retrieve pdf for ${collection}/${filename}`,
      collection,
      filename,
    };
    fastify.event_logger.pep_standard_log_start(
      `pep_get_custom_content_get_pdf_start`,
      request,
      {
        ...log_payload,
      },
    );

    try {
      const substring = `${CUSTOM_CONTENT_S3_PATH}/${collection}/${filename}`;
      log_payload.page_path = substring;
      fastify.log.info(`Getting S3 object for ${substring}`);
      const path = get_jaip_s3_url(substring);

      const is_valid_range = is_valid_byte_range(request.headers.range);
      if (is_valid_range instanceof Error) {
        throw is_valid_range;
      }
      const range = is_valid_range ? request.headers.range : undefined;

      const [stream, s3_error, metadata] = await get_s3_object(path, range);
      if (s3_error) {
        throw s3_error;
      }
      if (metadata?.content_range) {
        reply.code(206);
        reply.header("content-range", metadata.content_range);
      }
      if (metadata?.content_length !== undefined) {
        reply.header("content-length", metadata.content_length);
      }
      reply.header("accept-ranges", metadata?.accept_ranges || "bytes");
      attach_abortable_stream(request, stream);
      await reply.type("application/pdf").send(stream);

      fastify.event_logger.pep_standard_log_complete(
        `pep_get_custom_content_get_pdf_complete`,
        request,
        reply,
        {
          ...log_payload,
          event_description: `successfully retrieved pdf for ${collection}/${filename}`,
        },
      );
    } catch (err) {
      const error = ensure_error(err);
      if (
        error instanceof AxiosError &&
        error.code === AxiosError.ERR_BAD_REQUEST
      ) {
        reply.code(404).send({ status: 404 });
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
          event_description: `failed to retrieve pdf for ${collection}`,
        },
        "custom_content",
        error,
      );
    }
  };
