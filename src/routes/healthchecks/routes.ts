import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { route_schemas } from "./schemas";
import { polaris_healthcheck, db_healthcheck } from "./helpers";

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = route_schemas.healthcheck;

  fastify.get("/healthz", opts, async () => {
    const service_discovery = await polaris_healthcheck(fastify);
    const db = await db_healthcheck(fastify);
    fastify.log.info(`Service Discovery Status: ${service_discovery}`);
    fastify.log.info(`Database Status: ${db}`);

    if (!service_discovery) {
      fastify.eventLogger.pep_healthcheck_error(
        "service_discovery",
        new Error("Service discovery failed without error"),
      );
    }
    if (!db) {
      fastify.eventLogger.pep_healthcheck_error(
        "database",
        new Error("Database test query failed without error"),
      );
    }

    return {
      server: true,
      service_discovery,
      db,
    };
  });
}

export default routes;
