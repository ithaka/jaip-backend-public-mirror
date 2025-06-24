import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { PSEUDO_DISCIPLINES, SEARCH_SERVICE } from "../../consts";
import axios from "axios";
import { ensure_error } from "../../utils";
import { LogPayload } from "../../event_handler";
import { attach_bulk_approval } from "./helpers";
import { jstor_types } from "@prisma/client";
import { DiscParams } from "../../types/routes";
import { Discipline, Journal } from "../../types/disciplines";

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
    fastify.event_logger.pep_standard_log_start(
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

      const url = code ? `${host}disciplines/${code}` : `${host}disciplines/`;
      fastify.log.info(`Checking disciplines/journals URL: ${url}`);
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

      const disciplines: Discipline[] = is_discipline_search
        ? response.data.filter((item: Discipline) => !item.parent)
        : [];
      const journals: Journal[] = is_discipline_search ? [] : response.data;
      if (is_discipline_search) {
        disciplines.push(...PSEUDO_DISCIPLINES);
        disciplines.sort((a, b) => a.label.localeCompare(b.label));
      }

      const groups = request.user.groups.map((group) => group.id);
      fastify.log.info(
        `Retrieved disciplines/journals, getting bulk approval statuses`,
      );
      const [items, processing_error] = await attach_bulk_approval(
        fastify,
        is_discipline_search ? jstor_types.discipline : jstor_types.headid,
        is_discipline_search ? disciplines : journals,
        groups,
      );
      if (processing_error) {
        throw processing_error;
      }

      if (is_discipline_search) {
        reply.send(items);
      } else {
        reply.send(items);
      }

      fastify.event_logger.pep_standard_log_complete(
        `${is_discipline_search ? "pep_disciplines_complete" : "pep_journals_complete"}`,
        request,
        reply,
        {
          ...log_payload,
          event_description: `successfully retrieved ${is_discipline_search ? "disciplines" : "journals"} and bulk approval statuses`,
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
          event_description: `failed to retrieve ${is_discipline_search ? "disciplines" : "journals"}`,
        },
        "auth",
        error,
      );
    }
  };
