import { request_permissions } from "../../database/prisma/client.js";
import { FEATURES, SWAGGER_TAGS } from "../../consts/index.js";
import { standard_post_errors } from "../../utils/index.js";

export const route_schemas = {
  // NOTE: No get route is necessary because the request permissions will be attached to facilities
  // during all facilities queries.
  add_request_permissions: {
    name: "add_request_permissions",
    description: `Adds a request permission setting.`,
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
        additionalProperties: {} as request_permissions,
      },
      ...standard_post_errors,
    },
    body: {
      type: "object",
      required: ["facility_id", "start_date"],
      properties: {
        facility_id: {
          type: "number",
        },
        start_date: {
          type: "string",
          format: "date-time",
        },
        end_date: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
            },
            { type: "null" },
          ],
        },
      },
    },
  },
  delete_request_permissions: {
    name: "delete_request_permissions",
    description: `Deletes a request permission by setting the end date to the past.`,
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
        description: "Request permission deleted",
      },
      ...standard_post_errors,
    },
    body: {
      type: "object",
      required: ["facility_id"],
      properties: {
        facility_id: {
          type: "number",
        },
      },
    },
  },
  edit_request_permissions: {
    name: "edit_request_permissions",
    description: `Edits an existing request permission.`,
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
        additionalProperties: {} as request_permissions,
      },
      ...standard_post_errors,
    },
    body: {
      type: "object",
      required: ["facility_id", "start_date"],
      properties: {
        facility_id: {
          type: "number",
        },
        start_date: {
          type: "string",
          format: "date-time",
        },
        end_date: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
            },
            { type: "null" },
          ],
        },
      },
    },
  },
};
