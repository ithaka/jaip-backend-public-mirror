import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifyPostgres from "@fastify/postgres";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";

import "dotenv/config";
import routes from "./routes";
import decorators from "./decorators";
import { SWAGGER_TAGS } from "./utils/swagger_tags";

const opts: RouteShorthandOptions = {};

const fastify: FastifyInstance = Fastify({
  logger: true,
  trustProxy: true,
});

fastify.register(fastifySwagger, {
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
});

fastify.register(fastifySwaggerUI, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: false,
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
});

fastify.register(fastifyCookie);

for (const decorator in decorators) {
  fastify.decorate(decorator, decorators[decorator]);
}

for (const route of routes) {
  fastify.register(route, opts);
}

const db_url = `postgres://${process.env.JAIP_DB_USERNAME}:${process.env.JAIP_DB_PASSWORD}@${process.env.JAIP_DB_LOCATION}:${process.env.JAIP_DB_PORT}/${process.env.JAIP_DB_NAME}`;
fastify.register(fastifyPostgres, {
  connectionString: db_url,
  name: "jaip_db",
});

const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: "0.0.0.0" });
    const address = fastify.server.address();
    fastify.log.info(address);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
