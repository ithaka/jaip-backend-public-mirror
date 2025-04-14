import { FastifyInstance } from "fastify";
import { polaris_healthcheck, db_healthcheck } from "./helpers";
import { ensure_error } from "../../utils";

export const healthchecks_handler = (fastify: FastifyInstance) => async () => {
  try {
    const service_discovery = await polaris_healthcheck(fastify);
    const db = await db_healthcheck(fastify);
    fastify.log.info(`Service Discovery Status: ${service_discovery}`);
    fastify.log.info(`Database Status: ${db}`);

    if (!service_discovery) {
      fastify.event_logger.pep_healthcheck_error(
        "service_discovery",
        new Error("Service discovery failed without error"),
      );
    }
    if (!db) {
      fastify.event_logger.pep_healthcheck_error(
        "database",
        new Error("Database test query failed without error"),
      );
    }
    return {
      server: true,
      service_discovery,
      db,
    };
  } catch (err) {
    const error = ensure_error(err);
    fastify.event_logger.pep_healthcheck_error("healthcheck", error);
  }
};
