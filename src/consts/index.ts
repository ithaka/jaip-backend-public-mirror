import type { EntityType } from "../types/entities";
import { HTTPMethods } from "fastify";

export const VALIDATED_METHODS = ["POST", "PUT", "DELETE"] as HTTPMethods[];

export const SUBDOMAINS = {
  admin: ["pep-admin", "admin.pep"],
  student: ["pep", "www.pep"],
};

export const ENTITY_TYPES: { [key: string]: EntityType } = {
  USERS: "users" as EntityType.users,
  FACILITIES: "facilities" as EntityType.facilities,
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
export const SERVICES = {
  session_manager: "session-service",
  search_service: "search-service",
  search3: "search3",
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
};

export const SEARCH3 = {
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
  },
  maps: {
    contentType: "cty_str",
    disciplines: "disc_str",
  } as { [key: string]: string },
};
