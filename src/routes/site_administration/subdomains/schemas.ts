import { SWAGGER_TAGS, UNGROUPED_FEATURES } from "../../../consts";
import { Subdomain } from "../../../types/routes";
import { standard_post_errors } from "../../../utils";

export const route_schemas = {
  get_subdomains: {
    name: "get_subdomains",
    description: `Returns all subdomains.`,
    tags: [SWAGGER_TAGS.private],
    method: "POST",
    requires: {
      any: {
        ungrouped: [
          UNGROUPED_FEATURES.add_subdomain,
          UNGROUPED_FEATURES.edit_subdomain,
          UNGROUPED_FEATURES.delete_subdomain,
        ],
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
          count: { type: "number" },
        },
      },
      ...standard_post_errors,
    },
    body: {
      type: "object",
      required: ["name", "page", "limit", "is_active"],
      properties: {
        name: { type: "string" },
        page: { type: "number" },
        limit: { type: "number" },
        is_active: { type: "boolean" },
      },
    },
  },
  add_subdomains: {
    name: "add_subdomains",
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
  delete_subdomains: {
    name: "delete_subdomains",
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
          minLength: 1,
        },
      },
    },
  },
  reactivate_subdomains: {
    name: "reactivate_subdomains",
    description: `Reactivates a deleted subdomain by setting is_active to true.`,
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
          minLength: 1,
        },
      },
    },
  },
  edit_subdomains: {
    name: "edit_subdomains",
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
          minLength: 1,
        },
        name: {
          type: "string",
          minLength: 1,
        },
      },
    },
  },
};
