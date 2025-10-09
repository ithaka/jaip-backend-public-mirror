import { SWAGGER_TAGS, MESSAGES } from "../../consts/index.js";
import { server_error } from "../../utils/index.js";

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
      ...server_error,
    },
  },
};
