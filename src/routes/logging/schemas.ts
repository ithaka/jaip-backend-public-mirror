import { SWAGGER_TAGS } from "../../consts/index.js";
import { LogPayload } from "../../event_handler/index.js";
import { server_error } from "../../utils/index.js";

export const route_schemas = {
  logging: {
    name: "logging",
    route: "/",
    description: `Creates new log`,
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
    body: {
      type: "object",
      additionalProperties: {} as LogPayload,
    },
  },
};
