import { FastifyInstance, RouteShorthandOptions } from "fastify";
import axios from "axios";
import { ensure_error } from "../../utils/error_verification";
import { route_schemas } from "./schemas";

const polaris_healthcheck = async (fastify: FastifyInstance) => {
  const url = "http://localhost:8888/healthcheck";
  try {
    const { data, status } = await axios.get(url);
    return data === "ok" && status === 200;
  } catch (err) {
    const error = ensure_error(err);
    fastify.eventLogger.pep_healthcheck_error("polaris", error);
    return false;
  }
};

const db_healthcheck = async (fastify: FastifyInstance) => {
  try {
    // An arbitrary and minimal query to check if the database is up and responding
    const result = await fastify.prisma.groups.findFirst();
    return result && !!result.id;
  } catch (err) {
    const error = ensure_error(err);
    fastify.eventLogger.pep_healthcheck_error("database", error);
    return false;
  }
};

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
