import {
  METADATA_ROUTE_PREFIX,
  PAGES_ROUTE_PREFIX,
  SWAGGER_TAGS,
} from "../../consts/index.js";
import { CedarMetadataReturn } from "../../types/routes.js";
import { standard_errors } from "../../utils/index.js";

export const route_schemas = {
  metadata: {
    name: "metadata",
    description: `Returns metadata.`,
    tags: [SWAGGER_TAGS.private],
    route: `${METADATA_ROUTE_PREFIX}/:iid`,
    path: {
      type: "string",
      properties: {
        iid: {
          type: "string",
        },
      },
    },
    response: {
      200: {
        type: "object",
        additionalProperties: {} as CedarMetadataReturn,
      },
      ...standard_errors,
    },
  },
  get_page: {
    name: "get_page",
    description: `Returns a page image.`,
    tags: [SWAGGER_TAGS.private],
    route: `${PAGES_ROUTE_PREFIX}/:iid/:page`,
    path: {
      type: "string",
      properties: {
        iid: {
          type: "string",
          properties: {
            page_index: {
              type: "string",
            },
          },
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
  get_pdf: {
    name: "get_pdf",
    description: `Returns a pdf.`,
    tags: [SWAGGER_TAGS.private],
    route: `${PAGES_ROUTE_PREFIX}/:iid`,
    path: {
      type: "string",
      properties: {
        iid: {
          type: "string",
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
