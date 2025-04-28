import { SWAGGER_TAGS, UNGROUPED_FEATURES } from "../../../../consts";
import { UngroupedFeature } from "../../../../types/features";
import { standard_post_errors } from "../../../../utils";

export const route_schemas = {
  get_ungrouped_features: {
    name: "get_ungrouped_features",
    description: `Returns all ungrouped features.`,
    route: "/get",
    tags: [SWAGGER_TAGS.private],
    method: "POST",
    requires: {
      any: {
        ungrouped: [
          UNGROUPED_FEATURES.add_ungrouped_feature,
          UNGROUPED_FEATURES.edit_ungrouped_feature,
          UNGROUPED_FEATURES.delete_ungrouped_feature,
        ],
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          features: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: {} as UngroupedFeature,
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

  add_ungrouped_feature: {
    name: "add_ungrouped_feature",
    description: `Adds an ungrouped feature.`,
    tags: [SWAGGER_TAGS.private],
    method: "POST",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.add_ungrouped_feature],
      },
    },
    response: {
      200: {
        type: "object",
        additionalProperties: {} as UngroupedFeature,
      },
      ...standard_post_errors,
    },
    body: {
      type: "object",
      required: ["name", "display_name", "category", "description"],
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
      },
    },
  },

  delete_ungrouped_feature: {
    name: "delete_ungrouped_feature",
    description: `Deletes an ungrouped by setting is_active to false and disabling the feature for all entities.`,
    tags: [SWAGGER_TAGS.private],
    method: "DELETE",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.delete_ungrouped_feature],
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
        },
      },
    },
  },

  reactivate_ungrouped_feature: {
    name: "reactivate_ungrouped_feature",
    description: `Reactivates a deleted ungrouped feature by setting is_active to true.`,
    route: "/reactivate",
    tags: [SWAGGER_TAGS.private],
    method: "PATCH",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.add_ungrouped_feature],
      },
    },
    response: {
      200: {
        type: "object",
        additionalProperties: {} as UngroupedFeature,
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

  edit_ungrouped_feature: {
    name: "edit_ungrouped_feature",
    description: `Edits an existing ungrouped feature.`,
    tags: [SWAGGER_TAGS.private],
    method: "PATCH",
    requires: {
      any: {
        ungrouped: [UNGROUPED_FEATURES.edit_ungrouped_feature],
      },
    },
    response: {
      200: {
        type: "object",
        additionalProperties: {} as UngroupedFeature,
      },
      ...standard_post_errors,
    },
    body: {
      type: "object",
      required: ["id", "name", "display_name", "category", "description"],
      properties: {
        id: {
          type: "number",
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
      },
    },
  },
};
