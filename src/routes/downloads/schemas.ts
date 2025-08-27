import { SWAGGER_TAGS, MESSAGES, OFFLINE_INDICES } from "../../consts";
import { server_error } from "../../utils";

export const route_schemas = {
  download_offline_index: {
    name: "download_offline_index",
    route: "/offline/:index_id",
    description: `Returns offline download index. ${MESSAGES.public_endpoint_disclaimer}`,
    tags: [SWAGGER_TAGS.public],
    body: {
      type: "object",
      required: ["index_id"],
      properties: {
        index_id: {
          type: "enum",
          enum: Object.keys(OFFLINE_INDICES),
        },
      },
    },
    response: {
      302: {
        description: "Redirects to the offline download index.",
        headers: {
          Location: {
            description: "The URL of the offline download index.",
            type: "string",
          },
        },
      },
      ...server_error,
    },
  },
};
