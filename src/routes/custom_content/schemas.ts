import {
  FEATURES,
  RESTRICTED_ITEMS_FEATURES,
  SWAGGER_TAGS,
} from "../../consts/index.js";
import { ReentryMetadata } from "../../types/custom_content.js";
import { standard_errors } from "../../utils/index.js";

export const route_schemas = {
  get_metadata: {
    name: "get_metadata",
    description: `Returns a list of all metadata for all approved content in a given collection.`,
    route: "/metadata/:collection",
    tags: [SWAGGER_TAGS.private],
    method: "GET",
    requires: {
      any: {
        grouped: {
          any: [...RESTRICTED_ITEMS_FEATURES, FEATURES.include_reentry_content],
        },
      },
    },
    response: {
      200: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: {} as ReentryMetadata,
        },
      },
      ...standard_errors,
    },
  },
  get_pdf: {
    name: "get_pdf",
    description: `Returns a pdf (streamed) from S3.`,
    route: "/pdf/:collection/:filename",
    tags: [SWAGGER_TAGS.private],
    method: "GET",
    requires: {
      any: {
        grouped: {
          any: [...RESTRICTED_ITEMS_FEATURES, FEATURES.include_reentry_content],
        },
      },
    },
    response: {
      200: {
        type: "object",
      },
      ...standard_errors,
    },
  },
};
