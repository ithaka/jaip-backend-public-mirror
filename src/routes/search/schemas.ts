import { SWAGGER_TAGS } from "../../consts";
import { standard_post_errors } from "../../utils";

export const route_schemas = {
  search: {
    name: "search",
    description: `Returns search results.`,
    tags: [SWAGGER_TAGS.private],
    response: {
      200: {
        type: "object",
        properties: {
          subdomain: { type: "string" },
        },
      },
      ...standard_post_errors,
    },
  },
};
