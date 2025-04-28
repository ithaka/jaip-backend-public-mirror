import { UNGROUPED_FEATURES } from "../../../../../consts";
import { basic_user_ungrouped } from "../../../users/fixtures";

export const get_ungrouped_feature_body_invalid = {
  page: 1,
  limit: 1,
  name: "",
};

export const get_ungrouped_feature_body_valid = {
  page: 1,
  limit: 1,
  name: "",
  is_active: true,
};

export const add_ungrouped_feature_body_invalid = {
  id: 1,
  name: "test-ungrouped-feature",
  display_name: "Test Ungrouped Feature",
  category: "Test Category",
};

export const add_ungrouped_feature_body_valid = {
  id: 1,
  name: "test-ungrouped-feature",
  display_name: "Test Ungrouped Feature",
  category: "Test Category",
  description: "Test Description",
};

export const edit_ungrouped_feature_body_invalid = {
  ...add_ungrouped_feature_body_invalid,
};

export const edit_ungrouped_feature_body_valid = {
  ...add_ungrouped_feature_body_valid,
};

export const reactivate_ungrouped_feature_body_invalid = {
  name: "new_ungrouped_feature",
};

export const reactivate_ungrouped_feature_body_valid = {
  id: 1,
};

export const delete_ungrouped_feature_body_invalid = {
  name: "new_ungrouped_feature",
};

export const delete_ungrouped_feature_body_valid = {
  id: 1,
};

export const basic_user_ungrouped_add_ungrouped_feature = {
  ...basic_user_ungrouped,
  entities: {
    ...basic_user_ungrouped.entities,
    name: "Basic User Ungrouped Add Ungrouped Feature",
    ungrouped_features_entities: [
      {
        enabled: true,
        ungrouped_features: {
          // The values here don't matter and aren't being tested, with the exception of the name
          id: 34,
          name: UNGROUPED_FEATURES.add_ungrouped_feature,
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

export const basic_user_ungrouped_edit_ungrouped_feature = {
  ...basic_user_ungrouped,
  entities: {
    ...basic_user_ungrouped.entities,
    name: "Basic User Ungrouped Edit Ungrouped Feature",
    ungrouped_features_entities: [
      {
        enabled: true,
        ungrouped_features: {
          // The values here don't matter and aren't being tested, with the exception of the name
          id: 34,
          name: UNGROUPED_FEATURES.edit_ungrouped_feature,
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

export const basic_user_ungrouped_remove_ungrouped_feature = {
  ...basic_user_ungrouped,
  entities: {
    ...basic_user_ungrouped.entities,
    name: "Basic User Ungrouped Remove Ungrouped Feature",
    ungrouped_features_entities: [
      {
        enabled: true,
        ungrouped_features: {
          // The values here don't matter and aren't being tested, with the exception of the name
          id: 34,
          name: UNGROUPED_FEATURES.delete_ungrouped_feature,
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

export const ungrouped_feature_response = [
  {
    id: 1,
    name: "test-ungrouped-feature",
    display_name: "Test Ungrouped Feature",
    category: "Test Category",
    description: "Test Description",
    is_active: true,
  },
];
