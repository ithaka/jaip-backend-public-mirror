import {
  FEATURES,
  RESTRICTED_ITEMS_FEATURES,
  SWAGGER_TAGS,
  UNGROUPED_FEATURES,
} from "../../consts";
import { standard_errors, standard_post_errors } from "../../utils";

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
  download_restricted_items: {
    name: "download_restricted_items",
    route: "/download",
    description: `Downloads .csv of restricted items.`,
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          any: RESTRICTED_ITEMS_FEATURES,
        },
        ungrouped: [UNGROUPED_FEATURES.manage_restricted_list],
      },
    },
    response: {
      200: {
        description: "Successfully retrieved download list.",
      },
      ...standard_errors,
    },
  },
  get_last_updated: {
    name: "last_updated",
    route: "/last-updated",
    description: `Returns the date of the most recently updated item on the Restricted list.`,
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          // Because getting facilities is important for the frontend to understand how to display restricted items, we allow
          // any of these permissions to access this route.
          any: [
            FEATURES.get_facilities,
            FEATURES.get_users,
            ...RESTRICTED_ITEMS_FEATURES,
          ],
        },
        ungrouped: [UNGROUPED_FEATURES.manage_restricted_list],
      },
    },
    response: {
      200: {
        description: "Successfully retrieved date.",
      },
      ...standard_errors,
    },
  },
};
