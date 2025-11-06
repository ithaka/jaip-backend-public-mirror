import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CustomContentParams } from "../../types/routes.js";
import { LogPayload } from "../../event_handler/index.js";
import { ensure_error } from "../../utils/index.js";
import { AxiosError } from "axios";
import {
  CUSTOM_CONTENT_BUCKET,
  CUSTOM_CONTENT_METADATA,
} from "../../consts/index.js";
import { get_s3_object } from "../pages/helpers.js";

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
      const url = `http://${CUSTOM_CONTENT_BUCKET}/${collection}/${filename}`;
      log_payload.page_path = url;
      fastify.log.info(`Getting S3 object for ${url}`);
      const [stream, s3_error] = await get_s3_object(url);
      if (s3_error) {
        throw s3_error;
      }
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
