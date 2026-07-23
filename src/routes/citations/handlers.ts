import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CEDAR_DELIVERY_SERVICE } from "../../consts/index.js";
import axios from "axios";
import { ensure_error } from "../../utils/index.js";
import { LogPayload } from "../../event_handler/index.js";
import { ItemIdentifierParams } from "../../types/routes.js";
import { generate_citations } from "./helpers.js";
import { CSL } from "../../types/citations.js";

export const citations_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as ItemIdentifierParams;
    const iid = params.iid;
    const log_payload: LogPayload = {
      log_made_by: "disciplines-api",
      event_description: `attempting to generate citations for ${iid}`,
      iid: iid,
    };

    // If there is no iid sent as a path parameter, then we can't get citations.
    if (!iid) {
      const msg = `An item id is required in order to generate citations`;
      reply.code(400).send(msg);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: msg,
        },
        "citations",
        new Error(msg),
      );
      return;
    }

    fastify.event_logger.pep_standard_log_start(
      `pep_citations_start`,
      request,
      {
        ...log_payload,
      },
    );
    try {
      const [cedar_host, cedar_host_error] = await fastify.discover(
        CEDAR_DELIVERY_SERVICE.name,
      );
      if (cedar_host_error) {
        throw cedar_host_error;
      }

      const url = `${cedar_host}${CEDAR_DELIVERY_SERVICE.path}`;

      const cedar_csl_response = await axios.get(url, {
        params: {
          ...CEDAR_DELIVERY_SERVICE.queries.params.csl_export,
          iid,
        },
      });

      if (cedar_csl_response.status !== 200) {
        // If cedar returns a 404, then it didn't find citation data for that item. We can pass that along
        // with an empty object.
        if (cedar_csl_response.status === 404) {
          reply.code(404);
          reply.send({});
          fastify.event_logger.pep_standard_log_complete(
            `pep_citations_complete`,
            request,
            reply,
            {
              ...log_payload,
              event_description: `successfully retrieved citations for ${iid}`,
              not_found: true,
            },
          );
          return;
        } else {
          // If there is another error response, we want to log that, but rather than returning an error code,
          // we will just return a 200 with an error message in the body. The frontend will handle error
          // display, and will do it more gracefully if it gets a 200 with an error message than if it gets a 500.
          reply.send({
            has_error: true,
            error_message: `Citation request failed: unable to retrieve metadata.`,
          });
          fastify.event_logger.pep_standard_log_complete(
            `pep_citations_complete`,
            request,
            reply,
            {
              ...log_payload,
              event_description: `failed to retrieve citations for ${iid}`,
              code: (cedar_csl_response.status || "").toString(),
              error_message: cedar_csl_response.statusText || "unknown error",
            },
          );
          return;
        }
      }

      const citations = await generate_citations(
        cedar_csl_response.data as CSL,
      );
      // As above, if there is an error generating citations, we will return a 200 with an error message in the body rather than a 500,
      // but we will log the event differently so that we can track it in the logs.
      if (citations.has_error) {
        reply.send(citations);
        fastify.event_logger.pep_standard_log_complete(
          `pep_citations_complete`,
          request,
          reply,
          {
            ...log_payload,
            event_description: `failed to generate citations for ${iid}`,
            error_message: citations.error_message,
          },
        );
        return;
      } else {
        reply.send(citations);
      }

      fastify.event_logger.pep_standard_log_complete(
        `pep_citations_complete`,
        request,
        reply,
        {
          ...log_payload,
          event_description: `successfully retrieved citations for ${iid}`,
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
          event_description: `failed to retrieve citations for ${iid}`,
          error_message: error.message,
        },
        "citations",
        error,
      );
    }
  };
