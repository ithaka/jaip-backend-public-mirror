// These are various facility and user objects for use across multiple tests.

import { ENTITY_TYPES, FEATURES, UNGROUPED_FEATURES } from "../../../consts";

export const internal_ithaka_permissions = (enabled: boolean) =>
  structuredClone([
    {
      enabled,
      features: {
        id: 106,
        name: FEATURES.use_protected_features,
        is_active: true,
      },
      groups: { id: 1 },
    },
    {
      enabled,
      features: { id: 71, name: FEATURES.is_hidden_user, is_active: true },
      groups: { id: 1 },
    },
    {
      enabled,
      features: { id: 101, name: FEATURES.manage_facilities, is_active: true },
      groups: { id: 1 },
    },
    {
      enabled,
      features: { id: 72, name: FEATURES.view_hidden_users, is_active: true },
      groups: { id: 1 },
    },
  ]);
export const user_permissions = (enabled: boolean) =>
  structuredClone([
    {
      enabled,
      features: { id: 100, name: FEATURES.get_facilities, is_active: true },
      groups: { id: 1 },
    },
    {
      enabled,
      features: { id: 67, name: FEATURES.get_users, is_active: true },
      groups: { id: 1 },
    },
    {
      enabled,
      features: { id: 68, name: FEATURES.add_or_edit_users, is_active: true },
      groups: { id: 1 },
    },
    {
      enabled,
      features: { id: 102, name: FEATURES.edit_facilities, is_active: true },
      groups: { id: 1 },
    },
    {
      enabled,
      features: { id: 70, name: FEATURES.remove_users, is_active: true },
      groups: { id: 1 },
    },
  ]);
export const media_review_permissions = (enabled: boolean) =>
  structuredClone([
    {
      enabled,
      features: { id: 73, name: FEATURES.approve_requests, is_active: true },
      groups: { id: 1 },
    },
    {
      enabled,
      features: { id: 74, name: FEATURES.deny_requests, is_active: true },
      groups: { id: 1 },
    },
    {
      enabled,
      features: { id: 75, name: FEATURES.bulk_approve, is_active: true },
      groups: { id: 1 },
    },
    {
      enabled,
      features: { id: 76, name: FEATURES.undo_bulk_approve, is_active: true },
      groups: { id: 1 },
    },
  ]);
export const search_result_permissions = (enabled: boolean) =>
  structuredClone([
    {
      enabled,
      features: { id: 41, name: FEATURES.print_pdf, is_active: true },
      groups: { id: 1 },
    },
    {
      enabled,
      features: { id: 34, name: FEATURES.view_abstract, is_active: true },
      groups: { id: 1 },
    },
    {
      enabled,
      features: {
        id: 36,
        name: FEATURES.view_book_description,
        is_active: true,
      },
      groups: { id: 1 },
    },
    {
      enabled,
      features: { id: 40, name: FEATURES.download_pdf, is_active: true },
      groups: { id: 1 },
    },
    {
      enabled,
      features: { id: 35, name: FEATURES.view_snippet, is_active: true },
      groups: { id: 1 },
    },
    {
      enabled,
      features: { id: 232, name: FEATURES.submit_requests, is_active: true },
      groups: { id: 1 },
    },
    {
      enabled,
      features: { id: 166, name: FEATURES.view_document, is_active: true },
      groups: { id: 1 },
    },
    {
      enabled,
      features: { id: 133, name: FEATURES.view_pdf, is_active: true },
      groups: { id: 1 },
    },
  ]);

export const groups = {
  ithaka: { id: 1, name: "Ithaka" },
  ilium: { id: 2, name: "Ilium" },
};
export const groups_entities = {
  single_group: [{ groups: groups.ithaka, role: "user" }],
  two_groups: [
    { groups: groups.ithaka, role: "user" },
    { groups: groups.ilium, role: "user" },
  ],
  facility: [{ groups: groups.ithaka, role: "facility" }],
};

export const basic_ithaka_admin = {
  jstor_id: "test@test.com",
  entities: {
    name: "Test User Ithaka Admin",
    id: 5,
    entity_type: ENTITY_TYPES.USERS,
    groups_entities: groups_entities.single_group,
    features_groups_entities: [
      ...search_result_permissions(true),
      ...media_review_permissions(true),
      ...user_permissions(true),
      ...internal_ithaka_permissions(true),
    ],
    ungrouped_features_entities: [],
  },
};

export const basic_admin = {
  jstor_id: "test@test.com",
  entities: {
    name: "Test User Basic Admin",
    id: 4,
    entity_type: ENTITY_TYPES.USERS,
    groups_entities: groups_entities.single_group,
    features_groups_entities: [
      ...search_result_permissions(true),
      ...media_review_permissions(true),
      ...user_permissions(true),
      ...internal_ithaka_permissions(false),
    ],
    ungrouped_features_entities: [],
  },
};

export const basic_reviewer = {
  jstor_id: "test@test.com",
  entities: {
    name: "Test User Basic Reviewer",
    id: 3,
    entity_type: ENTITY_TYPES.USERS,
    groups_entities: groups_entities.single_group,
    features_groups_entities: [
      ...search_result_permissions(true),
      ...media_review_permissions(true),
      ...user_permissions(false),
      ...internal_ithaka_permissions(false),
    ],
    ungrouped_features_entities: [],
  },
};

export const basic_user_ungrouped = {
  jstor_id: "test@test.com",
  entities: {
    name: "Test User Basic Ungrouped",
    id: 2,
    entity_type: ENTITY_TYPES.USERS,
    groups_entities: [],
    features_groups_entities: [],
    ungrouped_features_entities: [],
  },
};

export const basic_user_ungrouped_manage_superusers = {
  ...basic_user_ungrouped,
  entities: {
    ...basic_user_ungrouped.entities,
    name: "Basic User Ungrouped Manage Superusers",
    ungrouped_features_entities: [
      {
        enabled: true,
        ungrouped_features: {
          // The values here don't matter and aren't being tested, with the exception of the name
          id: 34,
          name: UNGROUPED_FEATURES.manage_superusers,
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
    name: "Basic User Ungrouped Create Group Admins",
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

export const basic_facility = {
  jstor_id: "test@test.com",
  entities: {
    name: "Test Facility",
    id: 1,
    entity_type: ENTITY_TYPES.FACILITIES,
    groups_entities: groups_entities.facility,
    features_groups_entities: [
      ...search_result_permissions(true),
      ...media_review_permissions(false),
      ...user_permissions(false),
      ...internal_ithaka_permissions(false),
    ],
    ungrouped_features_entities: [],
  },
};

export const basic_facility_without_permissions = {
  jstor_id: "test@test.com",
  entities: {
    name: "Test Facility",
    id: 1,
    entity_type: ENTITY_TYPES.FACILITIES,
    groups_entities: groups_entities.facility,
    features_groups_entities: [
      ...search_result_permissions(false),
      ...media_review_permissions(false),
      ...user_permissions(false),
      ...internal_ithaka_permissions(false),
    ],
    ungrouped_features_entities: [],
  },
};
