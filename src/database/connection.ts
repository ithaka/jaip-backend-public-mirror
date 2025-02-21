import fastify_postgres from "@fastify/postgres";
import { FastifyInstance } from "fastify";
import { console } from "node:inspector";

export const connect = async (app: FastifyInstance) => {
  console.log("Connecting to the database");
  console.log(process.env.JAIP_DB_LOCATION);
  app.register(fastify_postgres, {
    connectionString: process.env.DATABASE_URL,
    name: "jaip_db",
  });
};
