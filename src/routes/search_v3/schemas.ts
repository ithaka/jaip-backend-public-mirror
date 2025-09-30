import { SWAGGER_TAGS } from "../../consts";
import { standard_post_errors } from "../../utils";

export const route_schemas = {
  search: {
    name: "search",
    description: `Returns search results.`,
    tags: [SWAGGER_TAGS.private],
    body: {
      type: "object",
      required: ["query", "pageNo", "limit", "sort", "filters", "facets"],
      properties: {
        query: {
          type: "string",
        },
        pageNo: {
          type: "number",
        },
        limit: {
          type: "number",
        },
        sort: {
          type: "string",
        },
        filters: {
          type: "array",
          items: {
            type: "string",
          },
        },
        facets: {
          type: "array",
          items: {
            type: "string",
          },
          minItems: 1,
        },
        dois: {
          type: "array",
          items: {
            type: "string",
          },
        },
        contentTypes: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
    },
    response: {
      200: {
        description: "Successfully searched.",
      },
      ...standard_post_errors,
    },
  },
};
