import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";
import "dotenv/config";
import routes from "./routes";
import discover from "./plugins/service_discovery.mjs";

const opts: RouteShorthandOptions = {};

const fastify: FastifyInstance = Fastify({
  logger: true,
});

fastify.decorate("discover", discover);

for (const route of routes) {
  fastify.register(route, opts);
}

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
