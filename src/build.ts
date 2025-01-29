import Fastify from "fastify";
import fastify_swagger from "@fastify/swagger";
import fastify_swagger_ui from "@fastify/swagger-ui";
import fastify_cookie from "@fastify/cookie";

import { swagger_opts } from "./utils/swagger_opts";

import decorators from "./decorators";
import plugins from "./plugins";
import routes from "./routes";
import "dotenv/config";

import type { Services } from "./types/services";

function build(opts = {}, services: Services) {
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
  services.database.connect(app);

  return app;
}

export default build;
