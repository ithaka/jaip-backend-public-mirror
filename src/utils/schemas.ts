export const server_error = {
  500: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
};
export const standard_errors = {
  401: {
    description: "Unauthorized",
  },
  403: {
    description: "Forbidden",
  },
  ...server_error,
};

export const standard_post_errors = {
  400: {
    description: "Bad Request",
  },
  ...standard_errors,
};
