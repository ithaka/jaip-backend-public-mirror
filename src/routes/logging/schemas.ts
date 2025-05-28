import { SWAGGER_TAGS } from "../../consts";
import { LogPayload } from "../../event_handler";
import { server_error } from "../../utils";

export const route_schemas = {
  logging: {
    name: "logging",
    route: "/",
    description: `Creates new log`,
    tags: [SWAGGER_TAGS.private],
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
