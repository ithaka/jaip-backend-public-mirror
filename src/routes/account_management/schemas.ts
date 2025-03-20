import { SWAGGER_TAGS, FEATURES, UNGROUPED_FEATURES } from "../../consts";
import { User } from "../../types/entities";
import { server_error, standard_errors } from "../../utils";

const get_entities_body = {
  body: {
    type: "object",
    required: ["query", "page", "groups", "limit"],
    properties: {
      query: {
        type: "string",
      },
      page: {
        type: "number",
      },
      groups: {
        type: "array",
        items: {
          type: "number",
        },
      },
      limit: {
        type: "number",
      },
    },
  },
};
const get_entities_response = {
  response: {
    200: {
      type: "object",
      properties: {
        entities: {} as User[],
        total: {
          type: "number",
        },
      },
    },
    ...standard_errors,
  },
};

const remove_entities_body = {
  body: {
    type: "object",
    required: ["id", "groups"],
    properties: {
      id: {
        type: "number",
      },
      groups: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: {
              type: "number",
            },
            features: {
              type: "object",
              additionalProperties: {} as { [key: string]: boolean },
            },
          },
        },
        minLength: 1,
      },
    },
  },
};

const add_users_body = {
  body: {
    type: "object",
    required: ["groups", "contact", "name"],
    properties: {
      contact: {
        type: "string",
      },
      name: {
        type: "string",
        minLength: 1,
      },
      groups: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: {
              type: "number",
            },
            features: {
              type: "object",
              additionalProperties: {} as { [key: string]: boolean },
            },
          },
        },
        minLength: 1,
        // We don't really have a max number of groups, but we need the property here so we can modify it for facilities.
        maxLength: 1000,
      },
    },
  },
};
const get_add_facilities_body = () => {
  const request = { ...add_users_body };
  request.body.properties.groups.maxLength = 1;
  return request;
};
const remove_entity_response = {
  response: {
    200: {
      description: "Successfully removed entities",
    },
    ...standard_errors,
  },
};

export const route_schemas = {
  // Get entities
  get_users: {
    name: "get_users",
    description: `Returns an array of users`,
    method: "POST",
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          any: [FEATURES.get_users],
        },
        ungrouped: [
          UNGROUPED_FEATURES.manage_superusers,
          UNGROUPED_FEATURES.create_group_admins,
        ],
      },
    },
    ...get_entities_body,
    ...get_entities_response,
    ...server_error,
  },
  get_facilities: {
    name: "get_facilities",
    description: `Returns an array of facilities`,
    method: "POST",
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          any: [FEATURES.get_facilities, FEATURES.manage_facilities],
        },
      },
    },
    ...get_entities_body,
    ...get_entities_response,
    ...server_error,
  },

  // Remove entities
  remove_users: {
    name: "remove_users",
    description: `Removes users by changing type to 'removed' and deactivating group features`,
    method: "DELETE",
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          any: [FEATURES.remove_users],
        },
      },
    },
    ...remove_entities_body,
    ...remove_entity_response,
    ...server_error,
  },
  remove_facilities: {
    name: "remove_facilities",
    description: `Removes facilities by changing type type to 'removed' and deactivating group features`,
    method: "DELETE",
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          any: [FEATURES.manage_facilities],
        },
      },
    },
    ...remove_entities_body,
    ...remove_entity_response,
    ...server_error,
  },

  // Add entities
  add_users: {
    name: "add_users",
    description: `Adds users`,
    method: "POST",
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          any: [FEATURES.add_or_edit_users],
        },
        ungrouped: [
          UNGROUPED_FEATURES.manage_superusers,
          UNGROUPED_FEATURES.create_group_admins,
        ],
      },
    },
    ...add_users_body,
    ...remove_entity_response,
    ...server_error,
  },
  add_facilities: {
    name: "add_facilities",
    description: `Adds facilities`,
    method: "POST",
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          any: [FEATURES.manage_facilities],
        },
      },
    },
    ...get_add_facilities_body(),
    ...remove_entity_response,
    ...server_error,
  },

  // Edit entities
  edit_users: {
    name: "edit_users",
    description: `Edits existing users`,
    method: "PATCH",
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          any: [FEATURES.add_or_edit_users],
        },
        ungrouped: [
          UNGROUPED_FEATURES.manage_superusers,
          UNGROUPED_FEATURES.create_group_admins,
        ],
      },
    },
    ...add_users_body,
    ...remove_entity_response,
    ...server_error,
  },
  edit_facilities: {
    name: "edit_facilities",
    description: `Edits existing facilities`,
    method: "PATCH",
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          any: [FEATURES.manage_facilities],
        },
      },
    },
    ...get_add_facilities_body(),
    ...remove_entity_response,
    ...server_error,
  },
};
