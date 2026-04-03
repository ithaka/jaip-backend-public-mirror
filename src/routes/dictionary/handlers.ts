import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { LogPayload } from "../../event_handler/index.js";
import { ensure_error } from "../../utils/index.js";
import { WordnikWordData } from "../../types/dictionary.js";
import { get_word_data } from "./helpers.js";

export const headwords_search_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "dictionary-api",
    };
    fastify.event_logger.pep_standard_log_start(
      "pep_get_headwords_start",
      request,
      {
        ...log_payload,
        event_description: "attempting to get headwords",
      },
    );
    try {
      // Extract term from request parameters
      const params = request.params as { term: string };
      const term = params.term || "";
      log_payload.query = term;

      // Validate term length
      if (term.length < 2) {
        reply.code(400).send("Search term must be at least 2 characters long");
        fastify.event_logger.pep_error(
          request,
          reply,
          {
            ...log_payload,
            event_description: "headword search term too short",
          },
          "dictionary",
          new Error("Search term must be at least 2 characters long"),
        );
      }

      // Fetch headwords from the database
      const [headwords, error] = await fastify.db.get_headwords(term);
      if (error) {
        throw error;
      }
      log_payload.headwords = headwords;

      // Send the headwords in the response
      reply.send(headwords);

      fastify.event_logger.pep_standard_log_complete(
        "pep_get_headwords_complete",
        request,
        reply,
        log_payload,
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to retrieve headwords",
        },
        "dictionary",
        error,
      );
      reply.code(500).send(error.message);
    }
  };

export const word_search_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const log_payload: LogPayload = {
      log_made_by: "dictionary-api",
      // Initialize empty wordnik_data to be filled in later
      wordnik_data: {
        rates: {},
        definitions: {},
        pronunciations: {},
        etymologies: {},
      },
    };
    fastify.event_logger.pep_standard_log_start("pep_get_word_start", request, {
      ...log_payload,
      event_description: "attempting to get word",
    });
    try {
      const params = request.params as { term: string };
      const term = params.term || "";
      log_payload.query = term;

      // Error identification is built into get_word_data. We will return an object that indicates
      // if any of the api calls failed so the frontend can display appropriate error messages as
      // needed. We'll only return an error from this endpoint if something unexpected happens.
      const word_data: WordnikWordData = await get_word_data(term, log_payload);

      reply.send(word_data);

      fastify.event_logger.pep_standard_log_complete(
        "pep_get_word_complete",
        request,
        reply,
        log_payload,
      );
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_error(
        request,
        reply,
        {
          ...log_payload,
          event_description: "failed to retrieve word",
        },
        "dictionary",
        error,
      );
      reply.code(500).send(error.message);
    }
  };
