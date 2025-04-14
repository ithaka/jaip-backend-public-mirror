import { FastifyInstance } from "fastify";
import { ensure_error } from "../../utils";

export const db_healthcheck = async (fastify: FastifyInstance) => {
  try {
    // An arbitrary and minimal query to check if the database is up and responding
    const result = await fastify.prisma.groups.findFirst();
    return result && !!result.id;
  } catch (err) {
    const error = ensure_error(err);
    fastify.event_logger.pep_healthcheck_error("database", error);
    return false;
  }
};
