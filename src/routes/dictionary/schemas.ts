import { FEATURES, SWAGGER_TAGS } from "../../consts/index.js";
import { server_error } from "../../utils/index.js";

export const route_schemas = {
  headword_search: {
    name: "headword_search",
    description: `Returns an array of headwords given the search term, sorted from most to least common.`,
    route: "/:term",
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          any: [FEATURES.use_dictionary],
        },
      },
    },
    response: {
      200: {
        type: "array",
        items: {
          type: "string",
        },
      },
      ...server_error,
    },
  },
  word_search: {
    name: "word_search",
    description: `Returns an object containing definitions, pronunciation, and etymology for a given word.`,
    route: "/:term",
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          any: [FEATURES.use_dictionary],
        },
      },
    },
    response: {
      200: {
        type: "array",
        items: {
          type: "string",
        },
      },
      ...server_error,
    },
  },
};
