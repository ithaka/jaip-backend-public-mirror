import { SWAGGER_TAGS, MESSAGES } from "../../consts";

export const route_schemas = {
  alerts: {
    name: "alerts",
    description: `Returns alerts. ${MESSAGES.public_endpoint_disclaimer}`,
    tags: [SWAGGER_TAGS.public],
    response: {
      200: {
        type: "object",
        properties: {
          text: { type: "string" },
          status: { type: "string" },
        },
      },
      204: {
        description: "No alerts",
      },
      500: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
};
