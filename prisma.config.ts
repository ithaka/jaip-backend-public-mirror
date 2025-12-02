import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  // the main entry for your schema
  schema: "./prisma/schema.prisma",
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
