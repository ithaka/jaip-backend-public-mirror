import { FastifyInstance } from "fastify";
import { db_healthcheck } from "./helpers";
import { ensure_error } from "../../utils";

export const healthchecks_handler = (fastify: FastifyInstance) => async () => {
  try {
    const db = await db_healthcheck(fastify);
    fastify.log.info(`Database Status: ${db}`);

    if (!db) {
      fastify.event_logger.pep_healthcheck_error(
        "database",
        new Error("Database test query failed without error"),
      );
    }
    return {
      server: true,
      db,
    };
  } catch (err) {
    const error = ensure_error(err);
    fastify.event_logger.pep_healthcheck_error("healthcheck", error);
  }
};
