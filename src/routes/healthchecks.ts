import { FastifyInstance, RouteShorthandOptions } from "fastify";
import axios from "axios";
import { SWAGGER_TAGS } from "../utils/swagger_tags";
import { ensure_error } from "../utils/error_verification";
const polarisHealthcheck = async (fastify: FastifyInstance) => {
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

const dbHealthcheck = async (fastify: FastifyInstance) => {
  try {
    // A minimal query to check if the database is up and responding
    const result = await fastify.pg.jaip_db.query("SELECT 1");
    return result.rowCount === 1;
  } catch (err) {
    const error = ensure_error(err);
    fastify.eventLogger.pep_healthcheck_error("database", error);
    return false;
  }
};

async function routes(fastify: FastifyInstance, opts: RouteShorthandOptions) {
  opts.schema = {
    description: `Returns health information for the service, including indicators for service discovery and database access.`,
    tags: [SWAGGER_TAGS.healthcheck],
    response: {
      200: {
        type: "object",
        properties: {
          server: { type: "boolean" },
          service_discovery: { type: "boolean" },
          db: { type: "boolean" },
        },
      },
    },
  };

  fastify.get("/healthz", opts, async () => {
    const service_discovery = await polarisHealthcheck(fastify);
    const db = await dbHealthcheck(fastify);
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
