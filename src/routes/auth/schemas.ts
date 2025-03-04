import { User } from "../../types/entities";
import { SWAGGER_TAGS, MESSAGES } from "../../consts";
import { standard_errors } from "../../utils";

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
      ...standard_errors,
    },
  },
};
