import { targeted_alerts } from "../../database/prisma/client.js";
import { FEATURES, SWAGGER_TAGS } from "../../consts/index.js";
import { standard_post_errors } from "../../utils/index.js";

export const route_schemas = {
  get_alerts: {
    name: "get_alerts",
    description: `Returns all active/unexpired alerts or a paginated list of alerts.`,
    route: "/",
    tags: [SWAGGER_TAGS.public],
    method: "GET",
    response: {
      200: {
        type: "object",
        properties: {
          alerts: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: {} as targeted_alerts,
            },
          },
          total: { type: "number" },
        },
      },
      ...standard_post_errors,
    },
  },
  get_paginated_alerts: {
    name: "get_alerts",
    description: `Returns all active/unexpired alerts or a paginated list of alerts.`,
    route: "/get",
    tags: [SWAGGER_TAGS.private],
    method: "POST",
    requires: {
      any: {
        grouped: {
          any: [FEATURES.manage_facilities, FEATURES.edit_facilities],
        },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          alerts: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: {} as targeted_alerts,
            },
          },
          total: { type: "number" },
        },
      },
      ...standard_post_errors,
    },
    body: {
      type: "object",
      required: ["page", "limit", "groups"],
      properties: {
        name: { type: "string" },
        page: { type: "number" },
        limit: { type: "number" },
        is_active: { type: "boolean" },
        groups: {
          type: "array",
          items: {
            type: "number",
          },
        },
      },
    },
  },
  add_alert: {
    name: "add_alert",
    description: `Adds an alert.`,
    tags: [SWAGGER_TAGS.private],
    method: "POST",
    requires: {
      any: {
        grouped: {
          any: [FEATURES.manage_facilities, FEATURES.edit_facilities],
        },
      },
    },
    response: {
      200: {
        type: "object",
        subdomains: {
          type: "array",
          items: {
            type: "string",
          },
        },
        groups: {
          type: "array",
          items: {
            type: "number",
          },
        },
        facilities: {
          type: "array",
          items: {
            type: "number",
          },
        },
        additionalProperties: {} as targeted_alerts,
      },
      ...standard_post_errors,
    },
    body: {
      type: "object",
      required: ["text", "status", "start_date", "end_date", "is_active"],
      properties: {
        subdomains: {
          type: "array",
          items: {
            type: "string",
          },
        },
        groups: {
          type: "array",
          items: {
            type: "number",
          },
        },
        facilities: {
          type: "array",
          items: {
            type: "number",
          },
        },
        additionalProperties: {} as targeted_alerts,
      },
    },
  },
  delete_alert: {
    name: "delete_alert",
    description: `Deletes an alert by setting is_active to false.`,
    tags: [SWAGGER_TAGS.private],
    method: "DELETE",
    requires: {
      any: {
        grouped: {
          any: [FEATURES.manage_facilities, FEATURES.edit_facilities],
        },
      },
    },
    response: {
      204: {
        description: "Alert deleted",
      },
      ...standard_post_errors,
    },
    body: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "number",
        },
      },
    },
  },
  edit_alert: {
    name: "edit_alert",
    description: `Edits an existing alert.`,
    tags: [SWAGGER_TAGS.private],
    method: "PATCH",
    requires: {
      any: {
        grouped: {
          any: [FEATURES.manage_facilities, FEATURES.edit_facilities],
        },
      },
    },
    response: {
      200: {
        type: "object",
        additionalProperties: {} as targeted_alerts,
      },
      ...standard_post_errors,
    },
    body: {
      type: "object",
      required: ["id", "text", "status", "start_date", "end_date", "is_active"],
      properties: {
        subdomains: {
          type: "array",
          items: {
            type: "string",
          },
        },
        groups: {
          type: "array",
          items: {
            type: "number",
          },
        },
        facilities: {
          type: "array",
          items: {
            type: "number",
          },
        },
        additionalProperties: {} as targeted_alerts,
      },
    },
  },
};
