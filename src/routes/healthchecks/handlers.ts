import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { polaris_healthcheck, db_healthcheck } from "./helpers";
import { ensure_error } from "../../utils";

// This is a very simple handler to confirm that the server is running.
export const liveness_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      reply.send({});
      return;
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_healthcheck_error("liveness", error);
      reply.code(500).send({});
      return;
    }
  };

export const readiness_handler =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [service_discovery, service_discovery_error] =
        await polaris_healthcheck(fastify);
      const [db, db_error] = await db_healthcheck(fastify);
      fastify.log.info(`Service Discovery Status: ${service_discovery}`);
      fastify.log.info(`Database Status: ${db}`);

      if (!service_discovery) {
        fastify.event_logger.pep_healthcheck_error(
          "service_discovery",
          service_discovery_error ||
            new Error("Service discovery failed without error"),
        );
      }
      if (!db) {
        fastify.event_logger.pep_healthcheck_error(
          "database",
          db_error || new Error("Database test query failed without error"),
        );
      }
      reply.send({
        server: true,
        service_discovery,
        db,
      });

      return;
    } catch (err) {
      const error = ensure_error(err);
      fastify.event_logger.pep_healthcheck_error("healthcheck", error);
      reply.code(500).send({
        server: false,
        error: error.message,
      });
      return;
    }
  };
