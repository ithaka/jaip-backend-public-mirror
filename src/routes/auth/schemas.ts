import { User } from "../../types/entities";
import { SWAGGER_TAGS, MESSAGES } from "../../consts";

export const route_schemas = {
  session: {
    name: "auth_session",
    description: `Returns auth information based on ip address or email associated with UUID cookie. ${MESSAGES.public_endpoint_disclaimer}`,
    tags: [SWAGGER_TAGS.public],
    response: {
      200: {
        type: "object",
        properties: {
          currentUser: {} as User,
        },
      },
      500: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      401: {
        description: "Unauthorized",
      },
      403: {
        description: "Forbidden",
      },
    },
  },
};
