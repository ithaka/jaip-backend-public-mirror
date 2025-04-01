import { SWAGGER_TAGS, UNGROUPED_FEATURES } from "../../../../consts";
import { Feature } from "../../../../types/features";
import { standard_post_errors } from "../../../../utils";

export const route_schemas = {
  // This endpoint is used to get all group feature details,
  // so it doesn't require any specific permissions. Some
  // "protected" features are only available to those with the appropriate
  // permissions, and that logic is in the handler.
  get_group_features: {
    name: "get_group_features",
    description: `Returns all group features.`,
    route: "/get",
    tags: [SWAGGER_TAGS.private],
    method: "POST",
    response: {
      200: {
        type: "object",
        properties: {
          features: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: {} as Feature,
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

  add_group_feature: {
    name: "add_group_feature",
    description: `Adds a feature.`,
    tags: [SWAGGER_TAGS.private],
    method: "POST",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.add_feature],
      },
    },
    response: {
      200: {
        type: "object",
        additionalProperties: {} as Feature,
      },
      ...standard_post_errors,
    },
    body: {
      type: "object",
      required: [
        "name",
        "display_name",
        "category",
        "description",
        "is_admin_only",
        "is_protected",
      ],
      properties: {
        name: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
        display_name: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
        category: {
          type: "string",
          minLength: 1,
        },
        description: {
          type: "string",
          minLength: 1,
        },
        is_admin_only: {
          type: "boolean",
        },
        is_protected: {
          type: "boolean",
        },
      },
    },
  },

  delete_group_feature: {
    name: "delete_group_feature",
    description: `Deletes a feature by setting is_active to false and disabling the feature for all entities in all groups.`,
    tags: [SWAGGER_TAGS.private],
    method: "DELETE",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.delete_feature],
      },
    },
    response: {
      200: {
        description: "Feature deleted",
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

  reactivate_group_feature: {
    name: "reactivate_group_feature",
    description: `Reactivates a deleted group feature by setting is_active to true.`,
    route: "/reactivate",
    tags: [SWAGGER_TAGS.private],
    method: "PATCH",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.add_feature],
      },
    },
    response: {
      200: {
        type: "object",
        additionalProperties: {} as Feature,
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

  edit_group_feature: {
    name: "edit_group_feature",
    description: `Edits an existing group feature.`,
    tags: [SWAGGER_TAGS.private],
    method: "PATCH",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.edit_feature],
      },
    },
    response: {
      200: {
        type: "object",
        additionalProperties: {} as Feature,
      },
      ...standard_post_errors,
    },
    body: {
      type: "object",
      required: [
        "id",
        "name",
        "display_name",
        "category",
        "description",
        "is_admin_only",
        "is_protected",
      ],
      properties: {
        id: {
          type: "number",
          minLength: 1,
        },
        name: {
          type: "string",
          minLength: 1,
        },
        display_name: {
          type: "string",
          minLength: 1,
        },
        category: {
          type: "string",
          minLength: 1,
        },
        description: {
          type: "string",
          minLength: 1,
        },
        is_admin_only: {
          type: "boolean",
        },
        is_protected: {
          type: "boolean",
        },
      },
    },
  },
};
