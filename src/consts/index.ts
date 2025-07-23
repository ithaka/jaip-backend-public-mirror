import { status_options } from "@prisma/client";
import { Discipline } from "../types/disciplines";
import type { EntityType } from "../types/entities";
import { HTTPMethods } from "fastify";

export const VALIDATED_METHODS = ["POST", "PUT", "DELETE"] as HTTPMethods[];

export const EPHEMERAL_DOMAIN_ENDINGS = {
  admin: "admin.apps.test.cirrostratus.org",
  student: "student.apps.test.cirrostratus.org",
};

export const STATUS_OPTIONS = {
  ...status_options,
  Restricted: "Restricted",
};

export const SUBDOMAINS = {
  admin: ["pep-admin", "admin.pep", "admin.test-pep"],
  student: ["pep", "www.pep", "test-pep", "www.test-pep"],
};

export const GLOBAL_ROUTE_PREFIX = "/api";
export const GLOBAL_VERSION = "v2";
export const GLOBAL_ROUTE_PREFIX_VERSIONED = `${GLOBAL_ROUTE_PREFIX}/${GLOBAL_VERSION}`;

export const ENTITY_TYPES: { [key: string]: EntityType } = {
  USERS: "users" as EntityType.users,
  FACILITIES: "facilities" as EntityType.facilities,
};
export const ENTITY_ACTIONS = {
  ADD: "add",
  EDIT: "edit",
};
export const SWAGGER_TAGS = {
  public: "public",
  publicOverrides: "public overrides",
  private: "private",
  healthcheck: "healthcheck",
};
export const MESSAGES = {
  public_endpoint_disclaimer:
    "<strong>NOTE: The response from this endpoint can depend on certain cookies/headers that are provided with the request. This Swagger UI is NOT capable of providing such cookies/headers.</strong>",
};
export const PSEUDO_DISCIPLINES = [
  {
    code: "research_report",
    counts: {
      books: 0,
      journals: 0,
      pamphlets: 0,
    },
    label: "Research Reports",
    parent: false,
  } as Discipline,
];
export const PSEUDO_DISCIPLINE_CODES = PSEUDO_DISCIPLINES.map(
  (disc) => disc.code,
);
export const SWAGGER_OPTS = {
  openapi: {
    info: {
      title: `jaip-backend on ${process.env.ENVIRONMENT}`,
      description: "Swagger for jaip-backend",
      version: "2.0.0",
    },
    tags: [
      {
        name: SWAGGER_TAGS.public,
        description: "Endpoints exposed to the public",
      },
      {
        name: SWAGGER_TAGS.private,
        description: "Endpoints for internal use only",
      },
      {
        name: SWAGGER_TAGS.healthcheck,
        description: "Checks the health of service",
      },
    ],
  },
};

// This should be updated whenever a new feature is added to the database.
export const FEATURES = {
  add_or_edit_users: "add_or_edit_users",
  approve_requests: "approve_requests",
  bulk_approve: "bulk_approve",
  deny_requests: "deny_requests",
  download_pdf: "download_pdf",
  edit_facilities: "edit_facilities",
  get_facilities: "get_facilities",
  get_users: "get_users",
  is_hidden_user: "is_hidden_user",
  manage_facilities: "manage_facilities",
  print_pdf: "print_pdf",
  remove_users: "remove_users",
  submit_requests: "submit_requests",
  undo_bulk_approve: "undo_bulk_approve",
  use_protected_features: "use_protected_features",
  view_abstract: "view_abstract",
  view_book_description: "view_book_description",
  view_document: "view_document",
  view_hidden_users: "view_hidden_users",
  view_pdf: "view_pdf",
  view_snippet: "view_snippet",
  restricted_items_subscription: "restricted_items_subscription",
};

export const UNGROUPED_FEATURES = {
  add_group: "add_group",
  edit_group: "edit_group",
  delete_group: "delete_group",
  clear_history: "clear_history",
  manage_superusers: "manage_superusers",
  create_group_admins: "create_group_admins",
  add_subdomain: "add_subdomain",
  edit_subdomain: "edit_subdomain",
  delete_subdomain: "delete_subdomain",
  add_ungrouped_feature: "add_ungrouped_feature",
  edit_ungrouped_feature: "edit_ungrouped_feature",
  delete_ungrouped_feature: "delete_ungrouped_feature",
  edit_feature: "edit_feature",
  delete_feature: "delete_feature",
  add_feature: "add_feature",
  manage_restricted_list: "manage_restricted_list",
};

// Any of these features will allow some measure of access to the restricted items list.
export const RESTRICTED_ITEMS_FEATURES = [
  FEATURES.add_or_edit_users,
  FEATURES.approve_requests,
  FEATURES.deny_requests,
  FEATURES.edit_facilities,
  FEATURES.manage_facilities,
  FEATURES.remove_users,
  FEATURES.bulk_approve,
  FEATURES.undo_bulk_approve,
];

export const SESSION_MANAGER = {
  name: "session-service",
  path: "v1/graphql",
};

export const SEARCH_SERVICE = {
  name: "search-service",
  path: "disciplines/",
};

export const CEDAR_DELIVERY_SERVICE = {
  name: "cedar-delivery-service",
  path: "v3/content",
  queries: {
    params: {
      item_view: {
        format: "ITEM_VIEW_1",
      },
      identity_block: {
        format: "IDENTITY_BLOCK",
      },
    },
  },
};
export const SEARCH3 = {
  name: "search3",
  path: "v3.0/jstor/basic",
  queries: {
    defaults: {
      additional_fields: [
        "headid",
        "disc_str",
        "book_publisher",
        "book_description",
        "fpage",
        "lpage",
        "tb",
        "year",
        "ab",
        "cty",
        "cty_str",
      ],
      filter_queries: [
        '-ti:("Front Matter" OR "Back Matter" OR EDITORIAL OR "Volume Information" OR "INDEX TO ADVERTISERS")',
      ],
      content_set_flags: [
        "search_article",
        "search_chapter",
        "pamphlet",
        "review",
        "research_report",
        "mp_research_report_part",
      ],
      tokens: [],
    },
    maps: {
      contentType: "cty_str",
      disciplines: "disc_str",
    } as { [key: string]: string },
  },
};

export const SEARCH_SNIPPET_SERVICE = {
  name: "search-snippet-service",
  path: "v2/snippets",
};

export const ALE_QUERY_SERVICE = {
  name: "ale-query-service",
  path: "v3/authz/bySessionAndContents",
};
