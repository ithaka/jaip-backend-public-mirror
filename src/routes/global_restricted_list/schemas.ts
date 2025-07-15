import { SWAGGER_TAGS, UNGROUPED_FEATURES } from "../../consts";
import { standard_post_errors } from "../../utils";

export const route_schemas = {
  get_restricted_items: {
    name: "get_restricted_items",
    route: "/get",
    description: `Gets restricted items.`,
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.manage_restricted_list],
      },
    },
    body: {
      type: "object",
      required: ["page", "limit"],
      properties: {
        query: { type: "string" },
        pageNo: { type: "number" },
        limit: { type: "number" },
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
  restrict: {
    name: "restrict",
    route: "/restrict",
    description: `Submits a restricted item.`,
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.manage_restricted_list],
      },
    },
    body: {
      type: "object",
      required: ["doi", "reason"],
      properties: {
        reason: {
          type: "string",
        },
        doi: {
          type: "string",
        },
      },
    },
    response: {
      201: {
        description: "Successfully added item to the blocked list.",
      },
      ...standard_post_errors,
    },
  },
  unrestrict: {
    name: "unrestrict",
    route: "/unrestrict",
    description: `Removes an item from the restricted list.`,
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.manage_restricted_list],
      },
    },
    body: {
      type: "object",
      required: ["doi"],
      properties: {
        doi: {
          type: "string",
        },
      },
    },
    response: {
      201: {
        description: "Successfully removed item from the block list.",
      },
      ...standard_post_errors,
    },
  },
};
