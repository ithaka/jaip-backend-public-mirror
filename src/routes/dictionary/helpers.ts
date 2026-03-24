import axios, {
  type RawAxiosResponseHeaders,
  type AxiosResponseHeaders,
} from "axios";
import { ensure_error } from "../../utils/errors.js";
import {
  WORDNIK_SOURCE_DICTIONARY,
  WordnikEndpoints,
  get_wordnik_api_url,
  RATE_LIMIT_REMAINING_HOUR,
  RATE_LIMIT_REMAINING_MINUTE,
  RATE_LIMIT_LIMIT_MINUTE,
  RATE_LIMIT_LIMIT_HOUR,
} from "../../consts/dictionary/index.js";
import type {
  WordnikRateLimits,
  WordnikEtymology,
  WordnikPronunciation,
  WordnikDefinition,
  WordnikEtymologiesResult,
  WordnikPronunciationsResult,
  WordnikDefinitionsResult,
  WordnikWordData,
} from "../../types/dictionary.js";
import { LogPayload } from "../../types/event_logger.js";

/**
 * Sanitizes Wordnik etymology XML by converting `<tt>` tags to `<i>` and stripping
 * all other tags except `<i>` and `<div>`. This is a bit questionable, and if we start
 * finding cases where there are more unexpected tags or if we add another dictionary,
 * we may need a more robust solution. But it makes sense to avoid deeper XML parsing if we can.
 * @param xml - Raw XML string from Wordnik's etymology response
 * @returns Sanitized string with only `<i>` and `<div>` tags remaining
 */
const filter_wordnik_XML = (xml: string): string => {
  // Replace <tt>/</tt> with <i>/</i>
  const with_italic = xml.replace(/<tt>/gi, "<i>").replace(/<\/tt>/gi, "</i>");
  // Remove any tag that isn't <i>, </i>, <div>, </div>, or <div ...>
  return with_italic.replace(/<(?!\/?(?:i|div)[\s>])[^>]+>/gi, "").trim();
};

/**
 * Filters out definitions with empty or non-string text fields. We know that at
 * least some of these exist for proper names.
 * @param definitions - Array of Wordnik definition objects
 * @returns Definitions that have non-empty string text values
 */
const remove_empty_definitions = (
  definitions: WordnikDefinition[],
): WordnikDefinition[] =>
  definitions.filter((def) => {
    if (typeof def.text === "string") {
      return def.text.trim().length > 0;
    } else {
      // Some text fields are arrays (e.g., Wright). We may implement some other handling
      // for those cases eventually, but for now, we simply exclude them from results.
      return false;
    }
  });

/**
 * Extracts Wordnik API rate limit values from response headers.
 * @param headers - Axios response headers containing rate limit fields
 * @returns Parsed rate limit values for hourly and per-minute quotas
 */
const parse_rate_limits = (
  headers: RawAxiosResponseHeaders | AxiosResponseHeaders,
): WordnikRateLimits => ({
  remaining_hour: Number(headers[RATE_LIMIT_REMAINING_HOUR] ?? 0),
  remaining_minute: Number(headers[RATE_LIMIT_REMAINING_MINUTE] ?? 0),
  limit_minute: Number(headers[RATE_LIMIT_LIMIT_MINUTE] ?? 0),
  limit_hour: Number(headers[RATE_LIMIT_LIMIT_HOUR] ?? 0),
});

/**
 * Makes a GET request to a Wordnik API endpoint and returns the parsed response
 * with rate limit information. Returns an empty array on 404s without flagging an error,
 * because that's how Wordnik will indicate no results found.
 * @param word - The word to look up
 * @param endpoint - The Wordnik API endpoint to call
 * @param params - Additional query parameters to include in the request
 * @returns The response data, error status, rate limits, and optional error details
 */
const fetch_wordnik = async <T>(
  word: string,
  endpoint: WordnikEndpoints,
  params: Record<string, unknown> = {},
): Promise<{
  response: T[];
  is_error: boolean;
  rate_limits: WordnikRateLimits;
  error?: { message: string; code?: number };
}> => {
  try {
    const url = get_wordnik_api_url(word, endpoint);
    const response = await axios.get(url, {
      params: {
        api_key: process.env.WORDNIK_API_KEY,
        ...params,
      },
    });

    const rate_limits = parse_rate_limits(response.headers);

    if (response.data && Array.isArray(response.data)) {
      return {
        response: response.data as T[],
        is_error: false,
        rate_limits,
      };
    }
    return { response: [], is_error: false, rate_limits };
  } catch (error) {
    const err = ensure_error(error);
    const rate_limits =
      axios.isAxiosError(err) && err.response
        ? parse_rate_limits(err.response.headers)
        : {
            remaining_hour: 0,
            remaining_minute: 0,
            limit_minute: 0,
            limit_hour: 0,
          };

    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { response: [], is_error: false, rate_limits };
    }

    return {
      response: [] as T[],
      is_error: true,
      rate_limits,
      error: {
        message: err.message,
        code: axios.isAxiosError(err) ? err.status : undefined,
      },
    };
  }
};

/**
 * Fetches etymology data for a word from the Wordnik API and updates the log payload.
 * @param word - The word to look up etymologies for
 * @param log_payload - Logging payload to record rate limits and result counts
 * @returns Etymology response and error status
 */
const get_etymologies = async (
  word: string,
  log_payload: LogPayload,
): Promise<WordnikEtymologiesResult> => {
  const result = await fetch_wordnik<WordnikEtymology>(
    word,
    WordnikEndpoints.EtymologiesMulti,
    {
      sourceDictionary: WORDNIK_SOURCE_DICTIONARY,
    },
  );
  log_payload.wordnik_data!.rates = {
    remaining_hour: result.rate_limits.remaining_hour,
    remaining_minute: result.rate_limits.remaining_minute,
  };
  log_payload.wordnik_data!.etymologies = {
    found: result.response.length,
    returned: result.response.length,
    ...(result.error && { error: result.error }),
  };
  return { response: result.response, is_error: result.is_error };
};

/**
 * Fetches pronunciation data for a word from the Wordnik API and updates the log payload.
 * @param word - The word to look up pronunciations for
 * @param log_payload - Logging payload to record rate limits and result counts
 * @returns Pronunciation response and error status
 */
const get_pronunciations = async (
  word: string,
  log_payload: LogPayload,
): Promise<WordnikPronunciationsResult> => {
  const result = await fetch_wordnik<WordnikPronunciation>(
    word,
    WordnikEndpoints.Pronunciations,
    {
      useCanonical: true,
      typeFormat: WORDNIK_SOURCE_DICTIONARY,
      sourceDictionary: WORDNIK_SOURCE_DICTIONARY,
      limit: 50,
    },
  );
  log_payload.wordnik_data!.rates = {
    remaining_hour: result.rate_limits.remaining_hour,
    remaining_minute: result.rate_limits.remaining_minute,
  };
  log_payload.wordnik_data!.pronunciations = {
    found: result.response.length,
    returned: result.response.length,
    ...(result.error && { error: result.error }),
  };
  return { response: result.response, is_error: result.is_error };
};

/**
 * Fetches definition data for a word from the Wordnik API and updates the log payload.
 * @param word - The word to look up definitions for
 * @param log_payload - Logging payload to record rate limits and result counts
 * @returns Definition response and error status
 */
const get_definitions = async (
  word: string,
  log_payload: LogPayload,
): Promise<WordnikDefinitionsResult> => {
  const result = await fetch_wordnik<WordnikDefinition>(
    word,
    WordnikEndpoints.Definitions,
    {
      useCanonical: true,
      limit: 200,
      sourceDictionaries: WORDNIK_SOURCE_DICTIONARY,
    },
  );
  log_payload.wordnik_data!.rates = {
    remaining_hour: result.rate_limits.remaining_hour,
    remaining_minute: result.rate_limits.remaining_minute,
  };
  log_payload.wordnik_data!.definitions = {
    found: result.response.length,
    returned: result.response.length,
    ...(result.error && { error: result.error }),
  };
  return { response: result.response, is_error: result.is_error };
};

/**
 * Fetches etymologies, pronunciations, and definitions for a word in parallel,
 * then filters out empty etymologies and definitions before returning.
 * @param word - The word to look up
 * @param log_payload - Logging payload to record rate limits and result counts
 * @returns Combined word data with filtered etymologies, pronunciations, and definitions
 */
export const get_word_data = async (
  word: string,
  log_payload: LogPayload,
): Promise<WordnikWordData> => {
  // We are mutating the same log_payload object throughout the calls to get_etymologies,
  // get_pronunciations, and get_definitions. The only overlapping element is the rate limits,
  // but since these calls are made in parallel, the final rate limits recorded will be
  // from whichever call finishes last.
  const [etymologies, pronunciations, definitions] = await Promise.all([
    get_etymologies(word, log_payload),
    get_pronunciations(word, log_payload),
    get_definitions(word, log_payload),
  ]);

  // This will ensure that we only return etymologies that have content and that
  // the content replaces <tt> tags with <i> tags, as well as stripping out any other tags.
  const filtered_etymologies = etymologies.response
    .filter((etymology) => etymology.etymologyXML)
    .map((etymology) => ({
      ...etymology,
      etymologyXML: filter_wordnik_XML(etymology.etymologyXML),
    }));
  // This will let us identify cases where some number of responses were filtered out so
  // we can investigate unexpected responses from the API.
  log_payload.wordnik_data!.etymologies.returned = filtered_etymologies.length;

  // This will ensure that we remove empty or undefined text fields as well as non-string
  // text fields (some are arrays). Removing them and returning an empty array will allow
  // the frontend to display the appropriate messaging.
  const filtered_definitions = remove_empty_definitions(definitions.response);
  // This will let us identify cases where some number of responses were filtered out so
  // we can investigate unexpected responses from the API.
  log_payload.wordnik_data!.definitions.returned = filtered_definitions.length;

  return {
    etymologies: {
      ...etymologies,
      response: filtered_etymologies,
    },
    pronunciations,
    definitions: {
      ...definitions,
      response: filtered_definitions,
    },
  };
};
