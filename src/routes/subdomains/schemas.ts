import { SWAGGER_TAGS, MESSAGES } from "../../consts";

export const route_schemas = {
  subdomain: {
    description: `Returns subdomain validation. ${MESSAGES.public_endpoint_disclaimer}`,
    tags: [SWAGGER_TAGS.public],
    response: {
      200: {
        type: "object",
        properties: {
          subdomain: { type: "string" },
        },
      },
    },
  },
};
