import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  collectCoverageFrom: ["./src/**/*.ts"],
  coverageReporters: ["text", "text-summary"], // Prints coverage report to console instead of saving reports locally
  coverageThreshold: {
    global: {
      statements: 87,
      branches: 84,
      functions: 81,
      lines: 87,
    },
  },
};

export default config;