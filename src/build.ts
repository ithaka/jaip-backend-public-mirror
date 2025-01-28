import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";
import fastify_swagger from "@fastify/swagger";
import fastify_swagger_ui from "@fastify/swagger-ui";
import fastify_cookie from "@fastify/cookie";
import fastify_postgres from "@fastify/postgres";

import { swagger_opts } from "./utils/swagger_opts";

import decorators from "./decorators";
import plugins from "./plugins";
import routes from "./routes";
import "dotenv/config";

function build(opts = {}) {
  const app = Fastify(opts);

  // Swagger
  app.register(fastify_swagger, swagger_opts);
  app.register(fastify_swagger_ui, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
    staticCSP: false,
  });

  // Fastify cookie movies cookies to their own section of the Response object
  app.register(fastify_cookie);

  // Decorators
  for (const decorator in decorators) {
    app.decorate(decorator, decorators[decorator]);
  }

  // Plugins
  for (const { plugin, options } of Object.values(plugins)) {
    app.register(plugin, options);
  }

  // Routes
  for (const route of routes) {
    app.register(route, opts);
  }

  // Database
  const db_url = `postgres://${process.env.JAIP_DB_USERNAME}:${process.env.JAIP_DB_PASSWORD}@${process.env.JAIP_DB_LOCATION}:${process.env.JAIP_DB_PORT}/${process.env.JAIP_DB_NAME}`;
  app.register(fastify_postgres, {
    connectionString: db_url,
    name: "jaip_db",
  });

  return app;
}

export default build;
