import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifyPostgres from "@fastify/postgres";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";

import "dotenv/config";
import routes from "./routes";
import decorators from "./decorators";
import plugins from "./plugins";

import { swagger_opts } from "./utils/swagger_opts";

const opts: RouteShorthandOptions = {};

const fastify: FastifyInstance = Fastify({
  logger: true,
  trustProxy: true,
});

fastify.register(fastifySwagger, swagger_opts);

fastify.register(fastifySwaggerUI, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: false,
  },
  staticCSP: false,
  // transformStaticCSP: (header) => header,
});

fastify.register(fastifyCookie);

for (const decorator in decorators) {
  fastify.decorate(decorator, decorators[decorator]);
}

for (const { plugin, options } of Object.values(plugins)) {
  fastify.register(plugin, options);
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
