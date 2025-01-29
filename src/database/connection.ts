import fastify_postgres from "@fastify/postgres";
import { FastifyInstance } from "fastify";

export const connect = async (app: FastifyInstance) => {
  const db_url = `postgres://${process.env.JAIP_DB_USERNAME}:${process.env.JAIP_DB_PASSWORD}@${process.env.JAIP_DB_LOCATION}:${process.env.JAIP_DB_PORT}/${process.env.JAIP_DB_NAME}`;
  app.register(fastify_postgres, {
    connectionString: db_url,
    name: "jaip_db",
  });
};
