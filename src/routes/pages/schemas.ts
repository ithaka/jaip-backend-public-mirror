import { SWAGGER_TAGS } from "../../consts";
import { CedarMetadataReturn } from "../../types/routes";
import { standard_errors } from "../../utils";

export const route_schemas = {
  metadata: {
    name: "metadata",
    description: `Returns metadata.`,
    tags: [SWAGGER_TAGS.private],
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
        properties: {} as CedarMetadataReturn,
      },
      ...standard_errors,
    },
  },
  get_page: {
    name: "get_page",
    description: `Returns a page image.`,
    tags: [SWAGGER_TAGS.private],
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
