import { SWAGGER_TAGS } from "../../consts/index.js";
import { standard_post_errors } from "../../utils/index.js";

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
      },
    },
    response: {
      200: {
        description: "Successfully searched.",
      },
      ...standard_post_errors,
    },
  },
  status_search: {
    name: "status_search",
    description: `Returns search results based on status.`,
    tags: [SWAGGER_TAGS.private],
    route: "/:status",
    path: {
      type: "string",
      properties: {
        status: {
          type: "string",
        },
      },
    },
    body: {
      type: "object",
      required: [
        "statusQuery",
        "pageNo",
        "limit",
        "sort",
        "filters",
        "facets",
        "groups",
        "statusStartDate",
        "statusEndDate",
      ],
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
        groups: {
          type: "array",
          items: {
            type: "number",
          },
        },
        statusStartDate: {
          type: "string",
          format: "date-time",
        },
        statusEndDate: {
          type: "string",
          format: "date-time",
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
