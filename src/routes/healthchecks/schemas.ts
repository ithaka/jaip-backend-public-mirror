import { SWAGGER_TAGS } from "../../consts/index.js";

export const route_schemas = {
  readiness: {
    description: `Returns health information for the service, including indicators for service discovery and database access.`,
    tags: [SWAGGER_TAGS.healthcheck],
    route: "/readiness",
    response: {
      200: {
        type: "object",
        properties: {
          server: { type: "boolean" },
          service_discovery: { type: "boolean" },
          db: { type: "boolean" },
        },
      },
      500: {
        type: "object",
        properties: {
          server: { type: "boolean" },
          error: { type: "string" },
        },
      },
    },
  },
  liveness: {
    description: `Returns liveness information for the service.`,
    route: "/liveness",
    tags: [SWAGGER_TAGS.healthcheck],
    response: {
      200: {},
      500: {},
    },
  },
};
