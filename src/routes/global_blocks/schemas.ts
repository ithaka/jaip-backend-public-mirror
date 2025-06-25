import { SWAGGER_TAGS, UNGROUPED_FEATURES } from "../../consts";
import { standard_post_errors } from "../../utils";

export const route_schemas = {
  get_blocked_items: {
    name: "get_blocked_items",
    route: "/get",
    description: `Gets blocked items.`,
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.manage_block_list],
      },
    },
    body: {
      type: "object",
      required: ["page", "limit"],
      properties: {
        name: { type: "string" },
        page: { type: "number" },
        limit: { type: "number" },
      },
    },
    response: {
      200: {
        description: "Successfully searched.",
      },
      ...standard_post_errors,
    },
  },
  block: {
    name: "block",
    route: "/block",
    description: `Submits a blocked item.`,
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.manage_block_list],
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
  unblock: {
    name: "unblock",
    route: "/unblock",
    description: `Removes an item from the blocked list.`,
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.manage_block_list],
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
