import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  // The main entry for the schema. This is a directory which includes all the .prisma files,
  // with schema.prisma being the main one.
  schema: "./prisma/schema",
  // where migrations should be generated
  // what script to run for "prisma db seed"
  migrations: {
    path: "./prisma/migrations",
    seed: "tsx ./prisma/seed.ts",
  },
  // The database URL
  datasource: {
    // We know that DATABASE_URL is defined in our env and
    // in the build pipeline.
    url: process.env.DATABASE_URL!,
  },
});
