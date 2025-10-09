import { UNGROUPED_FEATURES } from "../../../../consts/index.js";
import { basic_user_ungrouped } from "../../users/fixtures.js";

export const get_groups_body_invalid = {
  page: 1,
  limit: 1,
  name: "",
};

export const get_groups_body_valid = {
  page: 1,
  limit: 1,
  name: "",
  is_active: true,
};

export const add_group_body_invalid = {
  name: "",
};

export const add_group_body_valid = {
  name: "new_group",
};

export const edit_group_body_invalid = {
  name: "new_group",
};

export const edit_group_body_valid = {
  id: 1,
  name: "new_group",
};

export const reactivate_group_body_invalid = {
  name: "new_group",
};

export const reactivate_group_body_valid = {
  id: 1,
};

export const delete_group_body_invalid = {
  name: "new_group",
};

export const delete_group_body_valid = {
  id: 1,
};

export const create_group_admin_body_invalid = {
  name: "new_group_admin",
};

export const create_group_admin_body_valid = {
  id: 1,
};

export const clear_history_body_invalid = {
  name: "new_group_admin",
};

export const clear_history_body_valid = {
  id: 1,
};

export const basic_user_ungrouped_add_groups = {
  ...basic_user_ungrouped,
  entities: {
    ...basic_user_ungrouped.entities,
    name: "Basic User Ungrouped Add Groups",
    ungrouped_features_entities: [
      {
        enabled: true,
        ungrouped_features: {
          // The values here don't matter and aren't being tested, with the exception of the name
          id: 34,
          name: UNGROUPED_FEATURES.add_group,
          display_name: "",
          category: "",
          description: "",
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
          enabled: true,
        },
      },
    ],
  },
};

export const basic_user_ungrouped_edit_groups = {
  ...basic_user_ungrouped,
  entities: {
    ...basic_user_ungrouped.entities,
    name: "Basic User Ungrouped Edit Group",
    ungrouped_features_entities: [
      {
        enabled: true,
        ungrouped_features: {
          // The values here don't matter and aren't being tested, with the exception of the name
          id: 34,
          name: UNGROUPED_FEATURES.edit_group,
          display_name: "",
          category: "",
          description: "",
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
          enabled: true,
        },
      },
    ],
  },
};

export const basic_user_ungrouped_create_group_admins = {
  ...basic_user_ungrouped,
  entities: {
    ...basic_user_ungrouped.entities,
    name: "Basic User Ungrouped Edit Group",
    ungrouped_features_entities: [
      {
        enabled: true,
        ungrouped_features: {
          // The values here don't matter and aren't being tested, with the exception of the name
          id: 34,
          name: UNGROUPED_FEATURES.create_group_admins,
          display_name: "",
          category: "",
          description: "",
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
          enabled: true,
        },
      },
    ],
  },
};

export const basic_user_ungrouped_clear_history = {
  ...basic_user_ungrouped,
  entities: {
    ...basic_user_ungrouped.entities,
    name: "Basic User Ungrouped Edit Group",
    ungrouped_features_entities: [
      {
        enabled: true,
        ungrouped_features: {
          // The values here don't matter and aren't being tested, with the exception of the name
          id: 34,
          name: UNGROUPED_FEATURES.clear_history,
          display_name: "",
          category: "",
          description: "",
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
          enabled: true,
        },
      },
    ],
  },
};

export const basic_user_ungrouped_remove_groups = {
  ...basic_user_ungrouped,
  entities: {
    ...basic_user_ungrouped.entities,
    name: "Basic User Ungrouped Remove Groups",
    ungrouped_features_entities: [
      {
        enabled: true,
        ungrouped_features: {
          // The values here don't matter and aren't being tested, with the exception of the name
          id: 34,
          name: UNGROUPED_FEATURES.delete_group,
          display_name: "",
          category: "",
          description: "",
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
          enabled: true,
        },
      },
    ],
  },
};

export const group_response = [
  {
    id: 10,
    name: "test-group",
    is_active: true,
    // created_at: new Date(`2023-10-01T00:00:00Z`),
    // updated_at: new Date(`2023-10-01T00:00:00Z`),
  },
];
