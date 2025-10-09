import { FastifyInstance } from "fastify";
import axios from "axios";
import { ensure_error } from "../../utils/index.js";

export const polaris_healthcheck = async (
  fastify: FastifyInstance,
): Promise<[boolean, Error | null]> => {
  const url = "http://localhost:8888/healthcheck";
  try {
    const { data, status } = await axios.get(url);
    return [data === "ok" && status === 200, null];
  } catch (err) {
    const error = ensure_error(err);
    fastify.event_logger.pep_healthcheck_error("polaris", error);
    return [false, error];
  }
};

export const db_healthcheck = async (
  fastify: FastifyInstance,
): Promise<[boolean, Error | null]> => {
  try {
    // An arbitrary and minimal query to check if the database is up and responding
    const result = await fastify.db.get_first_feature();
    return [!!result && !!result.id, null];
  } catch (err) {
    const error = ensure_error(err);
    fastify.event_logger.pep_healthcheck_error("database", error);
    return [false, error];
  }
};
