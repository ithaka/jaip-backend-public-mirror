import { UNGROUPED_FEATURES } from "../../../../../consts/index.js";
import { basic_user_ungrouped } from "../../../users/fixtures.js";

export const get_grouped_feature_body_invalid = {
  page: 1,
  limit: 1,
  name: "",
};

export const get_grouped_feature_body_valid = {
  page: 1,
  limit: 1,
  name: "",
  is_active: true,
};

export const add_grouped_feature_body_invalid = {
  id: 1,
  name: "test-feature",
  display_name: "Test Feature",
  category: "Test Category",
  description: "Test Description",
  is_admin_only: false,
};

export const add_grouped_feature_body_valid = {
  id: 1,
  name: "test-feature",
  display_name: "Test Feature",
  category: "Test Category",
  description: "Test Description",
  is_admin_only: false,
  is_protected: false,
};

export const edit_grouped_feature_body_invalid = {
  ...add_grouped_feature_body_invalid,
};

export const edit_grouped_feature_body_valid = {
  ...add_grouped_feature_body_valid,
};

export const reactivate_grouped_feature_body_invalid = {
  name: "new_grouped_feature",
};

export const reactivate_grouped_feature_body_valid = {
  id: 1,
};

export const delete_grouped_feature_body_invalid = {
  name: "new_grouped_feature",
};

export const delete_grouped_feature_body_valid = {
  id: 1,
};

export const basic_user_ungrouped_add_grouped_feature = {
  ...basic_user_ungrouped,
  entities: {
    ...basic_user_ungrouped.entities,
    name: "Basic User Ungrouped Add Feature",
    ungrouped_features_entities: [
      {
        enabled: true,
        ungrouped_features: {
          // The values here don't matter and aren't being tested, with the exception of the name
          id: 34,
          name: UNGROUPED_FEATURES.add_feature,
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

export const basic_user_ungrouped_edit_grouped_feature = {
  ...basic_user_ungrouped,
  entities: {
    ...basic_user_ungrouped.entities,
    name: "Basic User Ungrouped Edit Feature",
    ungrouped_features_entities: [
      {
        enabled: true,
        ungrouped_features: {
          // The values here don't matter and aren't being tested, with the exception of the name
          id: 34,
          name: UNGROUPED_FEATURES.edit_feature,
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

export const basic_user_ungrouped_remove_grouped_feature = {
  ...basic_user_ungrouped,
  entities: {
    ...basic_user_ungrouped.entities,
    name: "Basic User Ungrouped Remove Feature",
    ungrouped_features_entities: [
      {
        enabled: true,
        ungrouped_features: {
          // The values here don't matter and aren't being tested, with the exception of the name
          id: 34,
          name: UNGROUPED_FEATURES.delete_feature,
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

export const grouped_feature_response = [
  {
    id: 1,
    name: "test-feature",
    display_name: "Test Feature",
    category: "Test Category",
    description: "Test Description",
    is_admin_only: false,
    is_protected: false,
    is_active: true,
  },
];
