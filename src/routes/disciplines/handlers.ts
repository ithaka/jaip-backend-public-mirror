import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import axios from "axios";
import { ensure_error } from "../../utils";
import { LogPayload } from "../../event_handler";
import { attach_bulk_approval } from "./helpers";
import { jstor_types } from "@prisma/client";
import { DiscParams } from "../../types/routes";
import { SEARCH_SERVICE } from "../../consts";

export const disciplines_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as DiscParams;
    const code = params.code;
    const is_discipline_search = !code;

    const log_payload: LogPayload = {
      log_made_by: "disciplines-api",
      event_description: `attempting to retrive ${is_discipline_search ? "disciplines" : "journals"}`,
    };
    fastify.eventLogger.pep_standard_log_start(
      `${is_discipline_search ? "pep_disciplines_start" : "pep_journals_start"}`,
      request,
      {
        ...log_payload,
      },
    );
    try {
      const [host, search_error] = await fastify.discover(SEARCH_SERVICE.name);
      if (search_error) {
        throw search_error;
      }

      const url = code
        ? `${host}${SEARCH_SERVICE.path}${code}`
        : `${host}disciplines/`;
      const response = await axios.get(url);
      if (response.status !== 200) {
        throw new Error(
          `${is_discipline_search ? "Disciplines" : "Journals"} request failed: Status code not 200`,
        );
      }
      if (!response.data?.length) {
        throw new Error(
          `${is_discipline_search ? "Disciplines" : "Journals"}  request failed: None returned`,
        );
      }

      const groups = request.user.groups.map((group) => group.id);
      const [items, processing_error] = await attach_bulk_approval(
        fastify,
        is_discipline_search ? jstor_types.discipline : jstor_types.headid,
        response.data,
        groups,
      );
      if (processing_error) {
        throw processing_error;
      }

      reply.send(items);

      fastify.eventLogger.pep_standard_log_start(
        `${is_discipline_search ? "pep_disciplines_complete" : "pep_journals_complete"}`,
        request,
        {
          ...log_payload,
          event_description: `successfully retrieved ${is_discipline_search ? "disciplines" : "journals"} and bulk approval statuses`,
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
          event_description: `failed to retrieve ${is_discipline_search ? "disciplines" : "journals"}`,
        },
        "auth",
        error,
      );
    }
  };
