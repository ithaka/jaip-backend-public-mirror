import { SWAGGER_TAGS } from "../../utils";

export const route_schemas = {
  healthcheck: {
    description: `Returns health information for the service, including indicators for service discovery and database access.`,
    tags: [SWAGGER_TAGS.healthcheck],
    response: {
      200: {
        type: "object",
        properties: {
          server: { type: "boolean" },
          service_discovery: { type: "boolean" },
          db: { type: "boolean" },
        },
      },
    },
  },
};
