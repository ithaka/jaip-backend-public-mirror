import { SWAGGER_TAGS } from "../../consts/index.js";
import { standard_errors } from "../../utils/index.js";

export const route_schemas = {
  citations: {
    name: "citations",
    route: `/:iid`,
    description: `Returns an object with three citation formats.`,
    tags: [SWAGGER_TAGS.private],
    method: "GET",
    params: {
      type: "object",
      required: ["iid"],
      properties: {
        iid: {
          type: "string",
        },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          apa: { type: "string" },
          mla: { type: "string" },
          chicago: { type: "string" },
          has_error: { type: "boolean" },
          error_message: { type: "string" },
        },
      },
      ...standard_errors,
    },
  },
};
