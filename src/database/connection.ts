import fastify_postgres from "@fastify/postgres";
import { FastifyInstance } from "fastify";

export const connect = async (app: FastifyInstance) => {
  const db_url = `postgres://${process.env.JAIP_DB_USERNAME}:${process.env.JAIP_DB_PASSWORD}@${process.env.JAIP_DB_LOCATION}:${process.env.JAIP_DB_PORT}/${process.env.JAIP_DB_NAME}`;
  console.log("CONNECTING TO DATABASE", db_url);
  console.log("DATABASE_URL", process.env.DATABASE_URL);
  app.register(fastify_postgres, {
    connectionString: process.env.DATABASE_URL || db_url,
    name: "jaip_db",
  });
};
