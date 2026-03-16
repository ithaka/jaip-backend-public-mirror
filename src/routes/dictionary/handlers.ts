import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { LogPayload } from "../../event_handler/index.js";
import { ensure_error } from "../../utils/index.js";

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
      const exampleAWords = [
        "abacus",
        "abalone",
        "abandon",
        "abbey",
        "ability",
        "abject",
        "ablaze",
        "abnormal",
        "aboard",
        "abode",
        "abound",
      ];
      reply.send(exampleAWords);
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
    };
    fastify.event_logger.pep_standard_log_start("pep_get_word_start", request, {
      ...log_payload,
      event_description: "attempting to get word",
    });
    try {
      console.log("handler reached");
      const example_definition_response = [
        {
          id: "D5374500-1",
          partOfSpeech: "adverb",
          attributionText:
            "from The American Heritage® Dictionary of the English Language, 5th Edition.",
          sourceDictionary: "ahd-5",
          sequence: "1",
          score: 0,
          word: "down",
          attributionUrl: "https://ahdictionary.com/",
          wordnikUrl: "https://www.wordnik.com/words/down",
          citations: [],
          exampleUses: [],
          labels: [],
          notes: [],
          relatedWords: [],
          textProns: [],
        },
        {
          id: "D5374500-27",
          partOfSpeech: "adjective",
          attributionText:
            "from The American Heritage® Dictionary of the English Language, 5th Edition.",
          sourceDictionary: "ahd-5",
          text: "Moving or directed downward.",
          sequence: "27",
          score: 0,
          word: "down",
          exampleUses: [
            {
              text: "a down elevator.",
            },
          ],
          attributionUrl: "https://ahdictionary.com/",
          wordnikUrl: "https://www.wordnik.com/words/down",
          citations: [],
          labels: [],
          notes: [],
          relatedWords: [],
          textProns: [],
        },
        {
          id: "D5374500-42",
          partOfSpeech: "preposition",
          attributionText:
            "from The American Heritage® Dictionary of the English Language, 5th Edition.",
          sourceDictionary: "ahd-5",
          sequence: "42",
          score: 0,
          word: "down",
          attributionUrl: "https://ahdictionary.com/",
          wordnikUrl: "https://www.wordnik.com/words/down",
          citations: [],
          exampleUses: [],
          labels: [],
          notes: [],
          relatedWords: [],
          textProns: [],
        },
        {
          id: "D5374500-51",
          partOfSpeech: "noun",
          attributionText:
            "from The American Heritage® Dictionary of the English Language, 5th Edition.",
          sourceDictionary: "ahd-5",
          text: "Any of a series of four plays in American football or three plays in Canadian football during which a team must advance at least ten yards to retain possession of the ball.",
          sequence: "51",
          score: 0,
          labels: [
            {
              text: "Football",
              type: "fld",
            },
          ],
          word: "down",
          attributionUrl: "https://ahdictionary.com/",
          wordnikUrl: "https://www.wordnik.com/words/down",
          citations: [],
          exampleUses: [],
          notes: [],
          relatedWords: [],
          textProns: [],
        },
        {
          id: "D5374500-52",
          partOfSpeech: "intransitive verb",
          attributionText:
            "from The American Heritage® Dictionary of the English Language, 5th Edition.",
          sourceDictionary: "ahd-5",
          text: "To bring, put, strike, or throw down.",
          sequence: "52",
          score: 0,
          word: "down",
          exampleUses: [
            {
              text: "downed his opponent in the first round.",
            },
          ],
          attributionUrl: "https://ahdictionary.com/",
          wordnikUrl: "https://www.wordnik.com/words/down",
          citations: [],
          labels: [],
          notes: [],
          relatedWords: [],
          textProns: [],
        },
        {
          id: "D5374500-56",
          partOfSpeech: "idiom",
          attributionText:
            "from The American Heritage® Dictionary of the English Language, 5th Edition.",
          sourceDictionary: "ahd-5",
          text: "(<em>down on</em>)  Hostile or negative toward; ill-disposed to.",
          sequence: "56",
          score: 0,
          labels: [
            {
              text: "Informal",
              type: "fld",
            },
          ],
          word: "down",
          exampleUses: [
            {
              text: "was down on jogging after his injury.",
            },
          ],
          attributionUrl: "https://ahdictionary.com/",
          wordnikUrl: "https://www.wordnik.com/words/down",
          citations: [],
          notes: [],
          relatedWords: [],
          textProns: [],
        },
      ];
      const example_etymology_response = [
        {
          etymologyXML:
            "<div>[Middle English <i>doun</i>, from Old English <i>-dūne</i> (as in <i>ofdūne</i>, downwards), from <i>dūne</i>, dative of <i>dūn</i>, hill; see  dheuə- in Indo-European roots.]</div>",
          sourceDictionary: "ahd-5",
          id: "5cb3b2c72d22641ac777939d",
        },
        {
          etymologyXML:
            "<div>[Middle English <i>doune</i>, from Old English <i>dūn</i>, hill; see  dheuə- in Indo-European roots.]</div>",
          sourceDictionary: "ahd-5",
          id: "5cb3b2c72d22641ac7779389",
        },
        {
          etymologyXML:
            "<div>[Middle English <i>doun</i>, from Old Norse <i>dūnn</i>.]</div>",
          sourceDictionary: "ahd-5",
          id: "5cb3b2c72d22641ac777938a",
        },
      ];
      const example_pronunciation_response = [
        {
          seq: 0,
          raw: "doun",
          rawType: "ahd-5",
          id: "D5374500",
          attributionText:
            "from The American Heritage® Dictionary of the English Language, 5th Edition.",
          attributionUrl: "https://ahdictionary.com/",
        },
        {
          seq: 0,
          raw: "doun",
          rawType: "ahd-5",
          id: "D5374700",
          attributionText:
            "from The American Heritage® Dictionary of the English Language, 5th Edition.",
          attributionUrl: "https://ahdictionary.com/",
        },
        {
          seq: 0,
          raw: "doun",
          rawType: "ahd-5",
          id: "D5374600",
          attributionText:
            "from The American Heritage® Dictionary of the English Language, 5th Edition.",
          attributionUrl: "https://ahdictionary.com/",
        },
      ];
      const example_full_response = {
        definitions: {
          response: example_definition_response,
          is_error: false,
          is_success: true,
        },
        etymology: {
          response: example_etymology_response,
          is_error: false,
          is_success: true,
        },
        pronunciation: {
          response: example_pronunciation_response,
          is_error: false,
          is_success: true,
        },
      };
      reply.send(example_full_response);
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
