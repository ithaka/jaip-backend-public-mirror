import { SWAGGER_TAGS } from "./swagger_tags";
export const swagger_opts = {
  openapi: {
    info: {
      title: `jaip-backend on ${process.env.ENVIRONMENT}`,
      description: "Swagger for jaip-backend",
      version: "2.0.0",
    },
    tags: [
      {
        name: SWAGGER_TAGS.public,
        description: "Endpoints exposed to the public",
      },
      {
        name: SWAGGER_TAGS.private,
        description: "Endpoints for internal use only",
      },
      {
        name: SWAGGER_TAGS.healthcheck,
        description: "Checks the health of service",
      },
    ],
  },
};
