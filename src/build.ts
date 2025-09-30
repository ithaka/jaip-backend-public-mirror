import Fastify, { RequirementsSchema } from "fastify";
import fastify_swagger from "@fastify/swagger";
import fastify_swagger_ui from "@fastify/swagger-ui";
import fastify_cookie from "@fastify/cookie";
import fastify_cors from "@fastify/cors";

import {
  AUTH_ROUTE_PREFIX,
  GLOBAL_ROUTE_PREFIX_VERSIONED,
  SUBDOMAINS_VALIDATION_ROUTE_PREFIX,
  SWAGGER_OPTS,
  VALIDATED_METHODS,
} from "./consts";

import plugins from "./plugins";

import "dotenv/config";
import { requirements_guard, route_guard, validate } from "./routes/hooks";
import { SWAGGER_TAGS } from "./consts";
import { add_subdomain } from "./routes/hooks/add_subdomain";
import { RouteSettings } from "./types/routes";

// This modification allows us to extend the fastify schema with an
declare module "fastify" {
  interface RequirementsSchema extends FastifySchema {
    requires?: {
      any?: {
        grouped?: {
          all?: string[];
          any?: string[];
        };
        ungrouped?: string[];
      };
    };
  }
}

function build(opts = {}, route_settings: RouteSettings[]) {
  const app = Fastify(opts);

  app.register(fastify_cors, {
    origin: [/\.jstor\.org$/, /\.cirrostratus\.org$/],
    credentials: true,
  });

  app.addHook("onRoute", (routeOptions) => {
    app.log.info(`Adding route: ${routeOptions.url}`);

    // Add the subdomain to the request for all routes
    routeOptions.preHandler = [add_subdomain];

    // We add the route guard to all routes because it is responsible for adding the user object
    // when available. For public routes, it will allow traffic without a user, but for private routes,
    // it will return a 401 for requests with no user.
    const is_private = !!routeOptions.schema?.tags?.includes(
      SWAGGER_TAGS.private,
    );
    app.log.info(`Adding route guard to ${routeOptions.url}`);
    if (
      routeOptions.url !==
        `${GLOBAL_ROUTE_PREFIX_VERSIONED}${AUTH_ROUTE_PREFIX}` &&
      routeOptions.url !==
        `${GLOBAL_ROUTE_PREFIX_VERSIONED}${SUBDOMAINS_VALIDATION_ROUTE_PREFIX}`
    ) {
      routeOptions.preHandler.push(route_guard(is_private));
    }

    // NOTE: This handler takes advantage of the user object added in the route_guard,
    // and must therefore be added after the route guard.
    const schema = routeOptions.schema as RequirementsSchema;
    const requirements =
      schema.requires?.any?.grouped?.any ||
      schema.requires?.any?.grouped?.all ||
      schema.requires?.any?.ungrouped;
    if (requirements && requirements.length) {
      app.log.info(`Adding requirements guard to ${routeOptions.url}`);
      routeOptions.preHandler.push(requirements_guard);
    }

    const methods = Array.isArray(routeOptions.method)
      ? routeOptions.method
      : [routeOptions.method];
    for (const method of methods) {
      if (VALIDATED_METHODS.includes(method)) {
        app.log.info(`Adding validation to ${routeOptions.url}`);
        routeOptions.preValidation = [validate];
      }
    }
  });

  // Swagger
  app.register(fastify_swagger, SWAGGER_OPTS);
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

  // Plugins
  for (const { plugin, options } of Object.values(plugins)) {
    app.register(plugin, options);
  }

  // Routes
  for (const { routes, options } of route_settings) {
    app.register(routes, {
      ...opts,
      ...options,
    });
  }

  return app;
}

export default build;
