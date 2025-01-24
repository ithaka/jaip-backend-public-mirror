import { FastifyInstance, RouteShorthandOptions } from "fastify";
import axios from "axios";
import { SWAGGER_TAGS } from "../utils/swagger_tags";

const polarisHealthcheck = async () => {
  const url = "http://localhost:8888/healthcheck";
  let up = false;
  try {
    const { data, status } = await axios.get(url);
    up = data === "ok" && status === 200;
  } catch (err) {
    up = false;
  }
  return up;
};

const dbHealthcheck = async (fastify: FastifyInstance) => {
  try {
    const result = await fastify.pg.jaip_db.query("SELECT 1");
    return result.rowCount === 1;
  } catch (err) {
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
          up: { type: "boolean" },
          service_discovery: { type: "boolean" },
        },
      },
    },
  };

  fastify.get("/healthz", opts, async () => {
    const service_discovery = await polarisHealthcheck();
    const db = await dbHealthcheck(fastify);
    console.log("Service discovery:", service_discovery);
    console.log("Database:", db);
    return {
      up: true,
      service_discovery,
      db,
    };
  });
}

export default routes;
