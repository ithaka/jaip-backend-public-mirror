import { User } from "../../types/entities";
import { SWAGGER_TAGS, public_endpoint_disclaimer } from "../../utils";

export const route_schemas = {
  session: {
    description: `Returns auth information based on ip address or email associated with UUID cookie. ${public_endpoint_disclaimer}`,
    tags: [SWAGGER_TAGS.public],
    response: {
      200: {
        type: "object",
        properties: {
          currentUser: {} as User,
        },
      },
    },
  },
  subdomain: {
    description: `Returns subdomain validation. ${public_endpoint_disclaimer}`,
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
