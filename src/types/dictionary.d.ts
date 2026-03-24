export interface WordnikRateLimits {
  remaining_hour: number;
  remaining_minute: number;
  limit_minute: number;
  limit_hour: number;
}

export interface WordnikEtymology {
  etymologyXML: string;
  sourceDictionary: string;
  id: string;
}

export interface WordnikPronunciation {
  raw: string;
  attributionText: string;
  id: string;
}

export interface WordnikDefinition {
  partOfSpeech: string;
  attributionText: string;
  text: string | string[];
  word: string;
  id: string;
}

export interface WordnikEtymologiesResult {
  response: WordnikEtymology[];
  is_error: boolean;
}

export interface WordnikPronunciationsResult {
  response: WordnikPronunciation[];
  is_error: boolean;
}

export interface WordnikDefinitionsResult {
  response: WordnikDefinition[];
  is_error: boolean;
}

export interface WordnikWordData {
  etymologies: WordnikEtymologiesResult;
  pronunciations: WordnikPronunciationsResult;
  definitions: WordnikDefinitionsResult;
}

export interface WordnikDataLog {
  rates: {
    remaining_hour?: number;
    remaining_minute?: number;
  };
  definitions: {
    found?: number;
    returned?: number;
    error?: {
      code?: number;
      message: string;
    };
  };
  pronunciations: {
    found?: number;
    returned?: number;
    error?: {
      code?: number;
      message: string;
    };
  };
  etymologies: {
    found?: number;
    returned?: number;
    error?: {
      code?: number;
      message: string;
    };
  };
}
