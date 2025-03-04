import { FastifyInstance } from "fastify";
import { polaris_healthcheck, db_healthcheck } from "./helpers";

export const healthchecks_handler = (fastify: FastifyInstance) => async () => {
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
};
