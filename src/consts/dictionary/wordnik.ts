const WORDNIK_API_URL = "https://api.wordnik.com";
const WORDNIK_API_V4_PATH = "/v4/word.json";
const WORDNIK_API_V5_PATH = "/v5";

export const WORDNIK_SOURCE_DICTIONARY = "ahd-5";

export enum WordnikEndpoints {
  Definitions = "Definitions",
  Pronunciations = "Pronunciations",
  EtymologiesMulti = "EtymologiesMulti",
}

const WordnikEndpointPaths: Record<
  WordnikEndpoints,
  { path: string; version: string }
> = {
  // https://developer.wordnik.com/docs#!/word/getDefinitions
  [WordnikEndpoints.Definitions]: {
    path: "/definitions",
    version: WORDNIK_API_V4_PATH,
  },
  // https://developer.wordnik.com/docs#!/word/getTextPronunciations
  [WordnikEndpoints.Pronunciations]: {
    path: "/pronunciations",
    version: WORDNIK_API_V4_PATH,
  },
  // It is worth noting here that the etymologies endpoint we're using is not the one documented
  // in the v4 API docs, but rather a multi-etymology endpoint only available in v5. This endpoint
  // allows us to specify the dictionary source. The docs for v4 are here:
  // https://developer.wordnik.com/docs#!/word/getEtymologies
  // but our version is currently not publicly documented.
  [WordnikEndpoints.EtymologiesMulti]: {
    path: "/etymologiesMulti",
    version: WORDNIK_API_V5_PATH,
  },
};

export const get_wordnik_api_url = (
  word: string,
  endpoint: WordnikEndpoints,
): string => {
  const { path, version } = WordnikEndpointPaths[endpoint];
  return `${WORDNIK_API_URL}${version}/${word}${path}`;
};

export const RATE_LIMIT_REMAINING_HOUR = "x-ratelimit-remaining-hour";
export const RATE_LIMIT_REMAINING_MINUTE = "x-ratelimit-remaining-minute";
export const RATE_LIMIT_LIMIT_MINUTE = "x-ratelimit-limit-minute";
export const RATE_LIMIT_LIMIT_HOUR = "x-ratelimit-limit-hour";
