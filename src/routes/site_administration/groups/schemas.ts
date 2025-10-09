import { SWAGGER_TAGS, UNGROUPED_FEATURES } from "../../../consts/index.js";
import { Group } from "../../../types/groups.js";
import { standard_post_errors } from "../../../utils/index.js";

export const route_schemas = {
  get_groups: {
    name: "get_groups",
    description: `Returns all groups.`,
    route: "/get",
    tags: [SWAGGER_TAGS.private],
    method: "POST",
    requires: {
      any: {
        ungrouped: [
          UNGROUPED_FEATURES.add_group,
          UNGROUPED_FEATURES.edit_group,
          UNGROUPED_FEATURES.delete_group,
          // Because the approval history and superuser management
          // are also handled through the groups UI, we want to allow
          // users with those permissions to access the list of groups.
          UNGROUPED_FEATURES.clear_history,
          UNGROUPED_FEATURES.manage_superusers,
        ],
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          groups: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: {} as Group,
            },
          },
          total: { type: "number" },
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
  add_group: {
    name: "add_group",
    description: `Adds a group.`,
    tags: [SWAGGER_TAGS.private],
    method: "POST",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.add_group],
      },
    },
    response: {
      200: {
        type: "object",
        additionalProperties: {} as Group,
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
  delete_group: {
    name: "delete_group",
    description: `Deletes a group by setting is_active to false, setting all groups_entities to 'removed', and setting enabled to false for all features_groups_entities.`,
    tags: [SWAGGER_TAGS.private],
    method: "DELETE",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.delete_group],
      },
    },
    response: {
      200: {
        description: "Group deleted",
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
  reactivate_group: {
    name: "reactivate_group",
    description: `Reactivates a deleted group by setting is_active to true.`,
    route: "/reactivate",
    tags: [SWAGGER_TAGS.private],
    method: "PATCH",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.add_group],
      },
    },
    response: {
      200: {
        type: "object",
        additionalProperties: {} as Group,
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
  edit_group: {
    name: "edit_group",
    description: `Edits an existing group.`,
    tags: [SWAGGER_TAGS.private],
    method: "PATCH",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.edit_group],
      },
    },
    response: {
      200: {
        type: "object",
        additionalProperties: {} as Group,
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
  clear_history: {
    name: "clear_history",
    description: `Clears the media review history of a group`,
    route: "/clear-history",
    tags: [SWAGGER_TAGS.private],
    method: "DELETE",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.clear_history],
      },
    },
    response: {
      200: {
        description: "History cleared",
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
  create_group_admin: {
    name: "clear_history",
    description: `Clears the media review history of a group`,
    route: "/create-group-admin",
    tags: [SWAGGER_TAGS.private],
    method: "POST",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.create_group_admins],
      },
    },
    response: {
      200: {
        description: "Group admin created",
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
};
