import { FEATURES, SWAGGER_TAGS } from "../../consts/index.js";
import { standard_post_errors } from "../../utils/index.js";

export const route_schemas = {
  request: {
    name: "request",
    route: "/request",
    description: `Submits a request for media review.`,
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          all: [FEATURES.submit_requests],
        },
      },
    },
    body: {
      type: "object",
      required: ["dois"],
      properties: {
        comments: {
          type: "string",
        },
        dois: {
          type: "array",
          items: {
            type: "string",
          },
          minItems: 1,
        },
      },
    },
    response: {
      201: {
        description: "Successfully added request to the database.",
      },
      ...standard_post_errors,
    },
  },
  approve: {
    name: "approve",
    route: "/approve",
    description: `Submits an approval for a given doi`,
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          all: [FEATURES.approve_requests],
        },
      },
    },
    body: {
      type: "object",
      required: ["doi", "groups"],
      properties: {
        doi: {
          type: "string",
        },
        groups: {
          type: "array",
          items: {
            type: "number",
          },
          minItems: 1,
        },
      },
    },
    response: {
      201: {
        description: "Successfully added approval to the database.",
      },
      ...standard_post_errors,
    },
  },
  deny: {
    name: "deny",
    route: "/deny",
    description: `Submits a denial for a given doi`,
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          all: [FEATURES.deny_requests],
        },
      },
    },
    body: {
      type: "object",
      required: ["doi", "groups", "reason", "comments"],
      properties: {
        doi: {
          type: "string",
        },
        groups: {
          type: "array",
          items: {
            type: "number",
          },
          minItems: 1,
        },
        reason: {
          type: "string",
          minLength: 4,
        },
        comments: {
          type: "string",
          minLength: 2,
        },
      },
    },
    response: {
      201: {
        description: "Successfully added denial to the database.",
      },
      ...standard_post_errors,
    },
  },
  incomplete: {
    name: "incomplete",
    route: "/incomplete",
    description: `Submits an incomplete status for a given doi`,
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          all: [FEATURES.deny_requests],
        },
      },
    },
    body: {
      type: "object",
      required: ["doi", "groups", "reason", "comments"],
      properties: {
        doi: {
          type: "string",
        },
        groups: {
          type: "array",
          items: {
            type: "number",
          },
          minItems: 1,
        },
        reason: {
          type: "string",
          minLength: 4,
        },
        comments: {
          type: "string",
          minLength: 4,
        },
      },
    },
    response: {
      201: {
        description: "Successfully added incomplete to the database.",
      },
      ...standard_post_errors,
    },
  },
  bulk: {
    name: "bulk",
    route: "/bulk",
    description: `Submits an bulk approval statuses for given disciplines and journals, as well as overturning denials`,
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          all: [FEATURES.bulk_approve],
        },
      },
    },
    body: {
      type: "object",
      required: ["groups"],
      properties: {
        groups: {
          type: "array",
          items: {
            type: "number",
          },
          minItems: 1,
        },
        disciplines: {
          type: "array",
          items: {
            type: "string",
          },
        },
        journals: {
          type: "array",
          items: {
            type: "string",
          },
        },
        documents: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
    },
    response: {
      201: {
        description: "Successfully added incomplete to the database.",
      },
      ...standard_post_errors,
    },
  },
  bulk_undo: {
    name: "bulk_undo",
    route: "/bulk-undo",
    description: `Reverses an existing bulk approval status for a given discipline code or journal headid`,
    tags: [SWAGGER_TAGS.private],
    requires: {
      any: {
        grouped: {
          all: [FEATURES.bulk_approve],
        },
      },
    },
    body: {
      type: "object",
      required: ["groups", "code"],
      properties: {
        groups: {
          type: "array",
          items: {
            type: "number",
          },
          minItems: 1,
        },
        code: {
          type: "string",
        },
      },
    },
    response: {
      201: {
        description: "Successfully added incomplete to the database.",
      },
      ...standard_post_errors,
    },
  },
};
