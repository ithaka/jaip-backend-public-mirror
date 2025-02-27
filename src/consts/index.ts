import type { EntityType } from "../types/entities";

export const ADMIN_SUBDOMAINS = ["pep-admin", "admin.pep"];
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
