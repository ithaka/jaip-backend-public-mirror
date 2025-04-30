import { FEATURES, SWAGGER_TAGS, UNGROUPED_FEATURES } from "../../../consts";
import { Subdomain } from "../../../types/routes";
import { standard_post_errors } from "../../../utils";

export const route_schemas = {
  get_subdomains: {
    name: "get_subdomains",
    description: `Returns all subdomains.`,
    route: "/get",
    tags: [SWAGGER_TAGS.private],
    method: "POST",
    requires: {
      any: {
        ungrouped: [
          UNGROUPED_FEATURES.add_subdomain,
          UNGROUPED_FEATURES.edit_subdomain,
          UNGROUPED_FEATURES.delete_subdomain,
        ],
        grouped: [
          FEATURES.manage_facilities,
        ]
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          subdomains: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                subdomain: { type: "string" },
                is_active: { type: "boolean" },
                created_at: { type: "string" },
                updated_at: { type: "string" },
              },
            },
          },
          total: { type: "number" },
        },
      },
      ...standard_post_errors,
    },
    body: {
      type: "object",
      required: ["is_active"],
      properties: {
        name: { type: "string" },
        page: { type: "number" },
        limit: { type: "number" },
        is_active: { type: "boolean" },
      },
    },
  },
  add_subdomain: {
    name: "add_subdomain",
    description: `Adds a subdomain.`,
    tags: [SWAGGER_TAGS.private],
    method: "POST",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.add_subdomain],
      },
    },
    response: {
      200: {
        type: "object",
        additionalProperties: {} as Subdomain,
      },
      ...standard_post_errors,
    },
    body: {
      type: "object",
      required: ["name"],
      properties: {
        name: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
      },
    },
  },
  delete_subdomain: {
    name: "delete_subdomain",
    description: `Deletes a subdomain by setting is_active to false and removing linked facilities.`,
    tags: [SWAGGER_TAGS.private],
    method: "DELETE",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.delete_subdomain],
      },
    },
    response: {
      200: {
        description: "Subdomain deleted",
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
  reactivate_subdomain: {
    name: "reactivate_subdomain",
    description: `Reactivates a deleted subdomain by setting is_active to true.`,
    route: "/reactivate",
    tags: [SWAGGER_TAGS.private],
    method: "PATCH",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.add_subdomain],
      },
    },
    response: {
      200: {
        type: "object",
        additionalProperties: {} as Subdomain,
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
  edit_subdomain: {
    name: "edit_subdomain",
    description: `Edits an existing subdomain.`,
    tags: [SWAGGER_TAGS.private],
    method: "PATCH",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.edit_subdomain],
      },
    },
    response: {
      200: {
        type: "object",
        additionalProperties: {} as Subdomain,
      },
      ...standard_post_errors,
    },
    body: {
      type: "object",
      required: ["id", "name"],
      properties: {
        id: {
          type: "number",
        },
        name: {
          type: "string",
          minLength: 1,
        },
      },
    },
  },
};
