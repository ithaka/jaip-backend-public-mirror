import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";
import fc from "@fastify/cookie";
import fp from "@fastify/postgres";
import "dotenv/config";
import routes from "./routes";
import decorators from "./decorators";

const opts: RouteShorthandOptions = {};

const fastify: FastifyInstance = Fastify({
  logger: true,
  trustProxy: true,
});
fastify.register(fc);

for (const decorator in decorators) {
  fastify.decorate(decorator, decorators[decorator]);
}

for (const route of routes) {
  fastify.register(route, opts);
}

const db_url = `postgres://${process.env.JAIP_DB_USERNAME}:${process.env.JAIP_DB_PASSWORD}@${process.env.JAIP_DB_LOCATION}/${process.env.JAIP_DB_NAME}`;
fastify.register(fp, {
  connectionString: db_url,
});

fastify.get("/names", (req, reply) => {
  fastify.pg.query(
    "SELECT id, name FROM entities",
    function onResult(err, result) {
      reply.send(err || result);
    },
  );
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
