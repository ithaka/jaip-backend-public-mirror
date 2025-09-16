import { SWAGGER_TAGS, MESSAGES } from "../../consts";
import { server_error } from "../../utils";

export const route_schemas = {
  subdomain: {
    name: "validate_subdomain",
    route: "/",
    description: `Returns subdomain validation. ${MESSAGES.public_endpoint_disclaimer}`,
    tags: [SWAGGER_TAGS.public],
    response: {
      200: {
        type: "object",
        properties: {
          subdomain: { type: "string" },
        },
      },
      ...server_error,
    },
  },
};
