import { UNGROUPED_FEATURES } from "../../../../consts/index.js";
import { basic_user_ungrouped } from "../../users/fixtures.js";

export const get_subdomains_body_invalid = {
  page: 1,
  limit: 1,
  name: "",
};

export const get_subdomains_body_valid = {
  page: 1,
  limit: 1,
  name: "",
  is_active: true,
};

export const add_subdomain_body_invalid = {
  name: "",
};

export const add_subdomain_body_valid = {
  name: "new_subdomain",
};

export const edit_subdomain_body_invalid = {
  name: "new_subdomain",
};

export const edit_subdomain_body_valid = {
  id: 1,
  name: "new_subdomain",
};

export const reactivate_subdomain_body_invalid = {
  name: "new_subdomain",
};

export const reactivate_subdomain_body_valid = {
  id: 1,
};

export const delete_subdomain_body_invalid = {
  name: "new_subdomain",
};

export const delete_subdomain_body_valid = {
  id: 1,
};

export const basic_user_ungrouped_add_subdomains = {
  ...basic_user_ungrouped,
  entities: {
    ...basic_user_ungrouped.entities,
    name: "Basic User Ungrouped Add Subdomain",
    ungrouped_features_entities: [
      {
        enabled: true,
        ungrouped_features: {
          // The values here don't matter and aren't being tested, with the exception of the name
          id: 34,
          name: UNGROUPED_FEATURES.add_subdomain,
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

export const basic_user_ungrouped_edit_subdomains = {
  ...basic_user_ungrouped,
  entities: {
    ...basic_user_ungrouped.entities,
    name: "Basic User Ungrouped Edit Subdomain",
    ungrouped_features_entities: [
      {
        enabled: true,
        ungrouped_features: {
          // The values here don't matter and aren't being tested, with the exception of the name
          id: 34,
          name: UNGROUPED_FEATURES.edit_subdomain,
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

export const basic_user_ungrouped_remove_subdomains = {
  ...basic_user_ungrouped,
  entities: {
    ...basic_user_ungrouped.entities,
    name: "Basic User Ungrouped Remove Subdomain",
    ungrouped_features_entities: [
      {
        enabled: true,
        ungrouped_features: {
          // The values here don't matter and aren't being tested, with the exception of the name
          id: 34,
          name: UNGROUPED_FEATURES.delete_subdomain,
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

export const subdomain_response = [
  {
    id: 10,
    subdomain: "test-subdomain",
    is_active: true,
  },
];
