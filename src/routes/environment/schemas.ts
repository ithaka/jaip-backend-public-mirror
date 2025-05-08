import { SWAGGER_TAGS } from "../../consts";
import { server_error } from "../../utils";

export const route_schemas = {
  get_environment: {
    name: "get_environment",
    description: `Returns environment name`,
    tags: [SWAGGER_TAGS.public],
    response: {
      200: {
        type: "object",
        properties: {
          environment: { type: "string" },
        },
      },
      ...server_error,
    },
  },
};
